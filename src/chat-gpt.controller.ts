import { getAccessToken } from './auth.js';
import { ChatGPTUnofficialProxyAPI } from 'chatgpt';
import crypto from 'crypto';

const preDataPrompt = (stopWord: string) =>
  `Do not reply, just listen for my messages and repeat '${crypto
    .randomBytes(8)
    .toString('hex')}' until I say '${stopWord}'.`;
const generalPrompt = (stopWord: string, date: string, channel: string) =>
  `${stopWord}. Analyze my all previous messages in this conversation with you except the first message. This is collected messages history from Russian Game Development Community chat. Extract a short digest news about key discussion topics using format for every list entry '**title**: content'. Insert empty line between entries list. Use Discord messenger markdown to better text formatting. You should reply the result on Russian language. Do not repeat the task in the start of your result. Result of your message should start like 'Новости дня за **${date}** в канале ${channel}:'. Mention the participants in the discussion if it's important for context. Split result into key topics list, ignore swore content if it exists and do not mention this in the result.`;

const CHATGPT_TIMEOUT_MS = 2 * 60 * 1000;

export async function makeRequestToChatGPT(
  [channel, chunks]: readonly [`<#${string}>`, string[]],
  date: string,
): Promise<string | null> {
  const accessToken = await getAccessToken();
  let conversationId: string;

  if (!accessToken) return null;

  try {
    const chatGPT = new ChatGPTUnofficialProxyAPI({
      accessToken,
    });

    let messageId;

    const stopWord = crypto.randomBytes(8).toString('hex');
    const initial = await chatGPT.sendMessage(preDataPrompt(stopWord), {
      timeoutMs: CHATGPT_TIMEOUT_MS,
    });

    conversationId = initial.conversationId;
    messageId = initial.id;

    for (const chunk of chunks) {
      console.log(
        `Sending message chunk to ChatGPT with length ${chunk.length}`,
      );
      const chunkResult = await chatGPT.sendMessage(chunk, {
        timeoutMs: CHATGPT_TIMEOUT_MS,
        conversationId,
        parentMessageId: messageId,
      });

      messageId = chunkResult.id;
    }

    console.log(`Sending message to ChatGPT for the date '${date}'`);

    const prompt = generalPrompt(stopWord, date, channel);
    const response = await chatGPT.sendMessage(prompt, {
      timeoutMs: CHATGPT_TIMEOUT_MS,
      conversationId,
      parentMessageId: messageId,
    });

    return response.text;
  } catch (e) {
    console.error('Error sending request to ChatGPT:', e);
    return null;
  }
}
