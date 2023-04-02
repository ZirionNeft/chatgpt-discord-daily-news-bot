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
} from '../../utils.js';
import { BUTTON, COMMAND } from '../constants.js';
import { ButtonStyle } from 'discord-api-types/payloads/v10';

config();

const DISCORD_API_REQ_LIMIT = 100;
const MAX_TOKENS = 2900; // maximum number of tokens for ChatGPT 3.5

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

export async function getDailyNews(
  channel: TextBasedChannel,
  date: Dayjs,
): Promise<string | false | null> {
  const chunks = await channelMessagesIntoChunks(channel, date);
  const formattedDate = dayjs(date).utc(false).format('LL');

  if (!chunks.length) {
    return `\`No messages for day ${date.format('LL')} have been found\``;
  }

  abortController = new AbortController();
  const abortSignal = abortController.signal;

  return makeRequestToChatGPT(
    [channel.toString(), chunks],
    formattedDate.toString(),
    abortSignal,
  );
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
  const date = dateArg ? getValidatedDate(dateArg) : dayjs().utc(false);
  if (!date) {
    await interaction.reply({
      content: "Invalid date format. Please use 'DD.MM.YY'.",
      ephemeral: true,
    });
    return;
  }

  if (date.isAfter(dayjs().utc(false), 'd')) {
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

    const response = await getDailyNews(targetChannel, date);

    if (response === false) {
      await interaction.editReply('Command aborted.');
    } else if (!response) {
      await interaction.editReply('Error processing request.');
    } else {
      await interaction.deleteReply();
      await interaction.channel.send(response);
    }
  } catch (e) {
    console.error(e);
    if (interaction.isRepliable()) {
      interaction.editReply('Error processing request.').catch(console.error);
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
  const formattedMessages = await Promise.all(
    messages.map((message) => replaceDiscordTags(message)),
  );

  const lines = formattedMessages.map(
    ({ author, createdAt, content }) =>
      `${createdAt.toISOString()} — ${author.username}:\n${content
        .trim()
        .replace(/'/g, '"')}\n`,
  );

  return breakIntoChunks(lines, MAX_TOKENS);
}

async function fetchMessages(channel: TextChannel, targetDate: dayjs.Dayjs) {
  const targetMessages: Message[] = [];
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

    const filteredMessages = fetchedMessages.filter(
      (message: Message<true>) => {
        const isSameDate = dayjs(message.createdTimestamp)
          .utc(false)
          .isSame(targetDate, 'd');
        const isNotBot = !message.author.bot;

        const isNotEmptyMessage = !!message.content.trim().length;

        return isSameDate && isNotBot && isNotEmptyMessage;
      },
    );

    targetMessages.push(...filteredMessages.values());

    console.log(
      `Fetched ${fetchedMessages.size}, pushed ${filteredMessages.size}`,
    );
  } while (
    !dayjs(fetchedMessages.last()?.createdAt)
      .utc(false)
      .isBefore(targetDate, 'd')
  );

  return targetMessages;
}
