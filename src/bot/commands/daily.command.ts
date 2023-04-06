import {
  ActionRowBuilder,
  ButtonBuilder,
  Collection,
  CommandInteraction,
  GuildMember,
  Message,
  SlashCommandBuilder,
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import dayjs, { Dayjs } from 'dayjs';
import { config } from 'dotenv';
import { makeRequestToChatGPT } from '../../chatgpt/controller.js';
import {
  breakIntoChunks,
  delay,
  getArgument,
  replaceDiscordTags,
  getValidatedDate,
  removeLinks,
} from '../../utils.js';
import { BUTTON, COMMAND } from '../constants.js';
import { ButtonStyle } from 'discord-api-types/payloads/v10';
import { encode } from 'gpt-3-encoder';

config();

const DISCORD_API_REQ_LIMIT = 100;
const CHUNK_SIZE = 3950; // maximum number of tokens for ChatGPT 3.5
const MIN_TOKENS_FOR_RESULT = 300;

export const cancelButton = new ButtonBuilder()
  .setCustomId(BUTTON.Cancel)
  .setLabel('Cancel')
  .setStyle(ButtonStyle.Danger);

export const dailyCommandData = new SlashCommandBuilder()
  .setName(COMMAND.Daily)
  .setDescription('Generate short digest of key topics for specific channels')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Set channel from where content should be taken')
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName('date')
      .setDescription('The date to fetch messages from (DD.MM.YY)')
      .setRequired(false),
  );

let isCommandRunning = false;

let abortController: AbortController = null;

export async function sendDailyNews(
  channel: TextBasedChannel,
  target: TextBasedChannel,
  date: Dayjs,
): Promise<{ error: string } | void> {
  const chunks = await channelMessagesIntoChunks(target, date);
  const formattedDate = date.format('LL');

  if (!chunks.length) {
    return {
      error: `\`No messages for day ${formattedDate} have been found\``,
    };
  }

  if (chunks.length == 1 && encode(chunks[0]).length < MIN_TOKENS_FOR_RESULT) {
    return {
      error: `\`History must have at least ${MIN_TOKENS_FOR_RESULT} tokens to be analyzed\``,
    };
  }

  abortController = new AbortController();
  const abortSignal = abortController.signal;

  const gptResponse = await makeRequestToChatGPT(
    chunks,
    formattedDate.toString(),
    abortSignal,
  );

  if (Array.isArray(gptResponse) && gptResponse.length) {
    const header = `Новости дня за **${formattedDate}** в канале ${target}:`;

    gptResponse[0] = `${header}\n\n${gptResponse[0]}`;

    for (const response of gptResponse) {
      await channel.send(response);
    }
    return;
  } else if (typeof gptResponse == 'object' && 'error' in gptResponse) {
    console.error(gptResponse.error);
  } else {
    console.error(`Unknown response error: ${JSON.stringify(gptResponse)}`);
  }
  return {
    error: 'Internal error',
  };
}

export function handleDailyCommandCancelling() {
  abortController?.abort();
}

export async function handleDailyCommandInteraction(
  interaction: CommandInteraction,
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  if (
    !(interaction.member as GuildMember)?.permissions.has('ModerateMembers')
  ) {
    await interaction.reply({
      content: 'You are not permitted to use this command.',
      ephemeral: true,
    });
    return;
  }

  const dateArg = getArgument(interaction, 'date') as string;
  const date = dateArg ? getValidatedDate(dateArg) : dayjs.utc();
  if (!date) {
    await interaction.reply({
      content: "Invalid date format. Please use 'DD.MM.YY'.",
      ephemeral: true,
    });
    return;
  }

  if (date.isAfter(dayjs.utc(), 'd')) {
    await interaction.reply({
      content: 'Date should be today or before.',
      ephemeral: true,
    });
    return;
  }

  const channelId = (getArgument(interaction, 'channel') ??
    interaction.channelId) as string;

  const targetChannel = interaction.guild.channels.cache.get(channelId);
  if (!targetChannel?.isTextBased()) {
    await interaction.reply({ content: 'Invalid channel.', ephemeral: true });
    return;
  }

  if (
    !targetChannel
      .permissionsFor(interaction.member as GuildMember)
      .has('ViewChannel')
  ) {
    await interaction.reply({
      content: 'You are not permitted to see this channel.',
      ephemeral: true,
    });
    return;
  }

  if (
    !targetChannel
      .permissionsFor(interaction.guild.client.user)
      .has(['ViewChannel', 'SendMessages']) ||
    !interaction.channel
      .permissionsFor(interaction.guild.client.user)
      .has('SendMessages')
  ) {
    await interaction.reply({
      content: "I'm not have permissions to see and write in this channel.",
      ephemeral: true,
    });
    return;
  }

  if (isCommandRunning) {
    await interaction.reply({
      content: 'Command is running already, try a bit later',
      ephemeral: true,
    });
    return;
  }

  isCommandRunning = true;

  console.log(
    `Starting daily news command handling for channel ${targetChannel} and date ${date.toISOString()}`,
  );

  try {
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      cancelButton,
    );

    await interaction.reply({
      content: 'Asking for ChatGPT...',
      components: [row],
      ephemeral: true,
    });

    const response = await sendDailyNews(
      interaction.channel,
      targetChannel,
      date,
    );

    if (response && 'error' in response) {
      await interaction.editReply({
        content: response.error,
        components: [],
      });
    } else {
      await interaction.deleteReply();
    }
  } catch (e) {
    console.error(e);
    if (interaction.isRepliable()) {
      interaction
        .editReply({
          content: 'Error processing request.',
          components: [],
        })
        .catch(console.error);
    }
  } finally {
    isCommandRunning = false;
    abortController = null;
  }
}

async function channelMessagesIntoChunks(
  channel: TextBasedChannel,
  date: Dayjs,
) {
  console.log(`Breaking messages data for ${channel.id} channel into chunks`);

  const messages = await fetchMessages(channel as TextChannel, date);

  const sanitize = async (message: Message) => {
    const contentWithoutTags = await replaceDiscordTags(message);
    const contentWithoutLinks = removeLinks(contentWithoutTags).trim();
    return contentWithoutLinks.trim().replace(/'/g, '"');
  };

  let latestAuthor;
  const lines = await messages.reduce(async (acc, message) => {
    const sanitizedContent = await sanitize(message);

    if (!sanitizedContent.length) {
      return acc;
    }

    const result = await acc;
    if (latestAuthor !== message.author.username) {
      latestAuthor = message.author.username;

      result.push(`${message.author.username}:\n${sanitizedContent}\n`);
    } else {
      result[result.length - 1] += `${sanitizedContent}\n`;
    }

    return result;
  }, Promise.resolve<string[]>([]));

  return breakIntoChunks(lines, CHUNK_SIZE);
}

async function fetchMessages(channel: TextChannel, targetDate: Dayjs) {
  const isValidMessage = (message: Message<true>) => {
    const isSameDate = dayjs
      .utc(message.createdTimestamp)
      .isSame(targetDate, 'd');
    const isNotBot = !message.author.bot;
    const isNotEmptyMessage = !!message.content.trim().length;
    const isNotOnlyLink = removeLinks(message.content).trim().length;

    return isSameDate && isNotBot && isNotEmptyMessage && isNotOnlyLink;
  };

  const firstMessage = await channel.messages.fetch(channel.lastMessageId);
  const targetMessages: Message[] = isValidMessage(firstMessage)
    ? [firstMessage]
    : [];
  let remainingRequests = DISCORD_API_REQ_LIMIT;

  const options = { limit: 100, before: channel.lastMessageId };
  let fetchedMessages: Collection<string, Message>;

  do {
    if (remainingRequests == 0) {
      console.log('Reached rate limit, waiting before continuing...');

      await delay(1000);
      remainingRequests = DISCORD_API_REQ_LIMIT;
    }

    fetchedMessages = await channel.messages.fetch(options);
    console.log(
      `Fetching messages in #${channel.name} channel before message ${options.before}...`,
    );
    options.before = fetchedMessages.last()?.id; // last message id
    remainingRequests--;

    const filteredMessages = fetchedMessages.filter(isValidMessage);

    targetMessages.push(...filteredMessages.values());

    console.log(
      `Fetched ${fetchedMessages.size}, pushed ${filteredMessages.size}`,
    );
  } while (
    !dayjs.utc(fetchedMessages.last()?.createdAt).isBefore(targetDate, 'd')
  );

  return targetMessages.reverse();
}
