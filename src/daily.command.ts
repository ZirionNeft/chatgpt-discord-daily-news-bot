import {
  ChatInputCommandInteraction,
  Guild,
  Message,
  TextChannel,
} from 'discord.js';
import { getAccessToken } from './auth.js';
import { ChatGPTUnofficialProxyAPI } from 'chatgpt';
import { getArgument, validateDate } from './utils.js';
import dayjs from 'dayjs';
import * as crypto from 'crypto';
import { config } from 'dotenv';

config();

const generalPrompt = `Analyze all previous data marked with 'Part N of data' using NLP technique and extract it as short daily news`;
const GUILD_SPECIFIC_CHANNELS = process.env.CHANNELS_IDS.split(',');
const CHATGPT_TOKENS_CAP = 4096;
const CHATGPT_TIMEOUT_MS = 30_000;

export async function handleDailyCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const dateArg = getArgument(interaction, 'date');
  const date = dateArg ? validateDate(dateArg) : dayjs();
  if (!date) {
    await interaction.reply("Invalid date format. Please use 'DD-MM-YYYY'.");
    return;
  }

  await interaction.deferReply();

  const csvLines = await collectCSVLines(interaction.guild, date);

  const chunks = groupCSVtoChunks(csvLines, CHATGPT_TOKENS_CAP);

  const chatGPTResponse = await sendCSVChunksToChatGPT(chunks);

  if (!chatGPTResponse) {
    await interaction.editReply('Error processing request.');
  } else {
    await interaction.editReply(chatGPTResponse);
  }
}

function groupCSVtoChunks(csvLines: string[], chunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of csvLines) {
    if (currentChunk.length + line.length + 1 <= chunkSize) {
      currentChunk += currentChunk.length === 0 ? line : `\n${line}`;
    } else {
      chunks.push(currentChunk);
      currentChunk = line;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function collectCSVLines(
  guild: Guild,
  date: dayjs.Dayjs,
): Promise<string[]> {
  const csvLines = ['username,date,content'];

  for (const channelId of GUILD_SPECIFIC_CHANNELS) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) continue;

    const messages = await fetchMessagesInDateRange(
      channel as TextChannel,
      date,
    );

    csvLines.push(
      ...messages.map(
        ({ author, createdAt, content }) =>
          `${author.username},${createdAt.toISOString()},${content}`,
      ),
    );
  }

  return csvLines;
}

async function fetchMessagesInDateRange(
  channel: TextChannel,
  date: dayjs.Dayjs,
): Promise<Message[]> {
  const startDate = date.startOf('day');
  const endDate = date.endOf('day');

  const messages = await channel.messages.fetch({
    after: startDate.toString(),
    before: endDate.toString(),
  });

  return Array.from(messages.values());
}

async function sendCSVChunksToChatGPT(
  csvChunks: string[],
): Promise<string | null> {
  const accessToken = await getAccessToken();

  if (!accessToken) return null;

  const chatGPT = new ChatGPTUnofficialProxyAPI({
    accessToken,
  });

  try {
    const conversationId = crypto.randomUUID();
    let parentId: string = null;

    for (let i = 0; i < csvChunks.length; i++) {
      const messageId = crypto.randomUUID();
      const prompt = `Part ${i + 1} of data:\n${csvChunks[i]}`;

      console.log(
        `${
          parentId ? `[${conversationId}] ${parentId} <- ` : ''
        }${messageId}: Sent chunk with index ${i}`,
      );

      const response = await chatGPT.sendMessage(prompt, {
        timeoutMs: CHATGPT_TIMEOUT_MS,
        messageId,
        conversationId,
        parentMessageId: parentId,
      });

      console.log(`INTERMEDIATE RESPONSE: ${response.text}`);
      parentId = messageId;
    }

    const messageId = crypto.randomUUID();
    const response = await chatGPT.sendMessage(generalPrompt, {
      timeoutMs: CHATGPT_TIMEOUT_MS,
      conversationId,
      messageId,
      parentMessageId: parentId,
    });

    return response.text;
  } catch (error) {
    console.error('Error sending request to ChatGPT:', error);
    return null;
  }
}
