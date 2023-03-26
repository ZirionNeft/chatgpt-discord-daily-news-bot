import {
  Collection,
  CommandInteraction,
  Message,
  SlashCommandBuilder,
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import { getArgument, breakIntoChunks, validateDate } from './utils.js';
import dayjs, { Dayjs } from 'dayjs';
import { config } from 'dotenv';
import { makeRequestToChatGPT } from './chat-gpt.controller.js';

config();

export const dailyCommandData = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Generate short digest of key topics for specific channels')
  .addStringOption((option) =>
    option
      .setName('date')
      .setDescription('The date to fetch messages from (DD-MM-YYYY)')
      .setRequired(false),
  )
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Set channel from where content should be taken')
      .setRequired(true),
  );

export async function sendDailyNews(channel: TextBasedChannel, date: Dayjs) {
  const channelChunks = await channelMessagesIntoChunks(channel, date);
  const formattedDate = dayjs(date).format('LL');

  return makeRequestToChatGPT(channelChunks, formattedDate.toString());
}

export async function handleDailyCommandInteraction(
  interaction: CommandInteraction,
): Promise<void> {
  const dateArg = getArgument(interaction, 'date') as string;
  const date = dateArg ? validateDate(dateArg) : dayjs();
  if (!date) {
    await interaction.reply("Invalid date format. Please use 'DD-MM-YYYY'.");
    return;
  }

  const channelId = (getArgument(interaction, 'channel') ??
    interaction.channelId) as string;

  const channel = interaction.guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) {
    await interaction.reply('Invalid channel.');
    return;
  }

  console.log(
    `Starting daily news command handling for channel ${channel} and date ${date}`,
  );

  const a = await interaction.deferReply({
    fetchReply: true,
  });
  await a.edit('Collecting news...');

  try {
    const response = await sendDailyNews(channel, date);

    if (!response) {
      await interaction.editReply('Error processing request.');
    } else {
      await interaction.editReply(response);
    }
  } catch (e) {
    console.error(e);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: 'Error during command processing',
      });
    }
  }
}

async function channelMessagesIntoChunks(
  channel: TextBasedChannel,
  date: Dayjs,
) {
  console.log(`Breaking messages data for ${channel.id} channel into chunks`);

  const messages = await fetchMessages(channel as TextChannel, date);
  const lines = messages.map(
    ({ author, createdAt, content }) =>
      `${createdAt.toISOString()} — ${author.username}:\n${content
        .trim()
        .replace(/'/g, '"')}\n`,
  );

  return [`<#${channel.id}>`, breakIntoChunks(lines)] as const;
}

async function fetchMessages(channel: TextChannel, targetDate: dayjs.Dayjs) {
  const targetMessages: Message[] = [];
  let remainingRequests = 100;

  const targetDayStart = targetDate.startOf('day').toDate();
  const targetDayEnd = targetDate.endOf('day').toDate();

  const options = { limit: 100, before: channel.lastMessageId };
  let fetchedMessages: Collection<string, Message>;
  let filteredSize = 0;

  do {
    if (remainingRequests === 0) {
      console.log('Reached rate limit, waiting before continuing...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      remainingRequests = 100;
    }

    fetchedMessages = await channel.messages.fetch(options);
    console.log(
      `Fetching messages in #${channel.name} channel before message ${options.before}...`,
    );
    options.before = fetchedMessages.last()?.id; // last message id
    remainingRequests--;

    const filteredMessages = fetchedMessages.filter((message: Message) =>
      dayjs(message.createdTimestamp).isBetween(targetDayStart, targetDayEnd),
    );
    filteredSize = filteredMessages.size;

    targetMessages.push(...filteredMessages.values());

    console.log(
      `Fetched ${fetchedMessages.size}, pushed ${filteredMessages.size}`,
    );

    if (dayjs(fetchedMessages.last()?.createdAt).isBefore(targetDayStart)) {
      break;
    }
  } while (fetchedMessages.size === 100 && filteredSize);

  return targetMessages;
}
