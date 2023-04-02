import Authenticator from './auth.js';
import { ChatGPTUnofficialProxyAPI } from 'chatgpt';
import crypto from 'crypto';
import { delay } from '../utils.js';

const preDataPrompt = (stopWord: string) =>
  `Do not reply, just listen for my messages and say '${crypto
    .randomBytes(8)
    .toString('hex')}' until I say '${stopWord}'.`;
const generalPrompt = (
  stopWord: string,
  chunkWord: string,
  date: string,
  channel: string,
) =>
  `${stopWord}. Analyze all messages in my conversation with you that starts with phrase '${chunkWord}'. This is collected messages history from Russian Game Development Community chat. Extract a long text news about key discussion topics using format for every list entry '**title**: content'. Insert empty line between entries list. Use Discord messenger markdown to better text formatting. You should reply the result on Russian language. Do not repeat the task in the start of your result. Result of your message should starts like 'Новости дня за **${date}** в канале ${channel}:'. Mention the participants of discussions if it's important for context. Ignore swore content if it exists and do not mention this in the result.`;

const CHATGPT_TIMEOUT_MS = 2 * 60 * 1000;

export async function makeRequestToChatGPT(
  [channel, chunks]: readonly [string, string[]],
  date: string,
  signal: AbortSignal,
): Promise<string | false | null> {
  let accessToken = process.env.CHATGPT_ACCESS_TOKEN;
  if (!accessToken) {
    console.log(
      'CHATGPT_ACCESS_TOKEN have not set, trying to log-in to ChatGPT...',
    );
    accessToken = await Authenticator.getAccessToken();
  }

  let conversationId: string;

  if (!accessToken) return null;

  try {
    const proxyUrl = process.env.PROXY;
    const chatGPT = new ChatGPTUnofficialProxyAPI({
      accessToken,
      ...(proxyUrl ? { apiReverseProxyUrl: proxyUrl } : {}),
    });

    const sendMessage = (async (...args) => {
      const maxRetries = 5;
      let counter = 1;

      const decorated = async () => {
        try {
          return await chatGPT.sendMessage(...args);
        } catch (e) {
          if (counter <= maxRetries) {
            console.warn(
              `${e.name}: ${e.message}; Making a new try... (${counter})`,
            );
            counter++;

            return decorated();
          } else {
            throw e;
          }
        }
      };

      return decorated();
    }) as ChatGPTUnofficialProxyAPI['sendMessage'];

    let messageId;

    const stopWord = crypto.randomBytes(8).toString('hex');
    const chunkWord = crypto.randomBytes(8).toString('hex');
    const initial = await sendMessage(preDataPrompt(stopWord), {
      timeoutMs: CHATGPT_TIMEOUT_MS,
    });

    conversationId = initial.conversationId;
    messageId = initial.id;

    for (const chunk of chunks) {
      console.log(
        `Sending message chunk to ChatGPT with length ${chunk.length}`,
      );

      const chunkResult = await sendMessage(`${chunkWord}\n\n${chunk}`, {
        timeoutMs: CHATGPT_TIMEOUT_MS,
        conversationId,
        parentMessageId: messageId,
        abortSignal: signal,
      });

      messageId = chunkResult.id;

      await delay(800);
    }

    console.log(`Sending message to ChatGPT for the date '${date}'`);

    const prompt = generalPrompt(stopWord, chunkWord, date, channel);
    const response = await sendMessage(prompt, {
      timeoutMs: CHATGPT_TIMEOUT_MS,
      conversationId,
      parentMessageId: messageId,
      abortSignal: signal,
    });

    return response.text;
  } catch (e) {
    if (e.name === 'AbortError') {
      return false;
    }

    console.error('Error sending request to ChatGPT:', e);
    return null;
  }
}
