import backoffRetryFactory from '#common/backoff-retry.js';
import config from '#common/config.js';
import logger from '#common/logger.js';
import { encode } from 'gpt-3-encoder';
import type ChatGPTClient from './chatgpt.client.js';

const backoffRetry = backoffRetryFactory({
  retryOnNullish: true,
  strategy: (currentTry) => 1000 * 2 ** currentTry,
  retryCount: 3,
});

export default class ChatGPTService {
  readonly #client: ChatGPTClient;

  constructor(client: ChatGPTClient) {
    this.#client = client;
  }

  async getCompletion(chunks: string[], date: string): Promise<string[]> {
    logger.info(`Sending message to ChatGPT for the date '${date}'`);

    const completionParts: string[] = [];

    for (const chunk of chunks) {
      try {
        const response = await this.sendMessage(chunk);

        completionParts.push(response);
      } catch (e: any) {
        logger.error(e);
      }
    }

    return completionParts;
  }

  private async sendMessage(text: string): Promise<string> {
    const timeoutMs = config.get('GPT_TIMEOUT_MS', 2 * 60 * 1000);

    const response = await backoffRetry(() => this.#client.provider.sendMessage(text, {
      timeoutMs,
    }));

    const tokenCost = config.get('GPT_TOKEN_COST');
    const responseTokens = encode(response.text).length;
    const promptTokens = encode(text).length;

    logger.info(
      `Prompt chunk tokens: ${promptTokens}, GPT completed tokens: ${responseTokens}; Spent ~${
        ((responseTokens + promptTokens) / 1000) * (tokenCost / 1e6)
      }`,
    );

    return response.text;
  }
}
