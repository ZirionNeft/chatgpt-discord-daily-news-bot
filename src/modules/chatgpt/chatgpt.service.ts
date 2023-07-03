import { encode } from 'gpt-3-encoder';
import {
  ConfigService,
  Inject,
  InternalErrorException,
  Provider,
  UseBackoff,
} from '../../core';
import { AbortControllerProvider } from '../bot';

import { ChatGPTClient } from './chatgpt.client.js';
import { RequestAbortedException } from './exceptions';

const BACKOFF_SEND_MESSAGE_TRIES = 3;

@Provider()
export class ChatGPTService {
  @Inject(ChatGPTClient)
  private readonly client: ChatGPTClient;

  @Inject(AbortControllerProvider)
  private readonly abortController;

  @Inject(ConfigService)
  private readonly config;

  async getCompletion(chunks: string[], date: string): Promise<string[]> {
    try {
      console.log(`Sending message to ChatGPT for the date '${date}'`);

      const completionParts: string[] = [];

      for (const chunk of chunks) {
        try {
          const response = await this.sendMessage(chunk);

          completionParts.push(response);
        } catch (e) {
          console.error(e);
        }
      }

      return completionParts;
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new RequestAbortedException();
      }
      console.error(e);

      throw new InternalErrorException(e.message);
    }
  }

  @UseBackoff(BACKOFF_SEND_MESSAGE_TRIES)
  private async sendMessage(text: string): Promise<string> {
    const timeoutMs = +this.config.get('GPT_TIMEOUT_MS', 2 * 60 * 1000);

    const response = await this.client.provider.sendMessage(text, {
      timeoutMs,
      abortSignal: this.abortController.signal,
    });

    const tokenCost = +this.config.get('GPT_TOKEN_COST', 0.0003);
    const responseTokens = encode(response.text).length;
    const promptTokens = encode(text).length;
    console.info(
      `Prompt chunk tokens: ${promptTokens}, GPT completed tokens: ${responseTokens}; Spent ~${
        ((responseTokens + promptTokens) / 1000) * tokenCost
      }`,
    );

    return response.text;
  }
}
