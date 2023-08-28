import { encode } from 'gpt-3-encoder';
import {
  ConfigService,
  Inject,
  InjectScope,
  Logger,
  Provider,
  UseBackoff,
} from '../../core';
import { AbortControllerProvider } from '../bot';

import { ChatGPTClient } from './chatgpt.client.js';
import { RequestAbortedException } from './exceptions';

const BACKOFF_SEND_MESSAGE_TRIES = 3;

@Provider({ scope: InjectScope.REQUEST })
export class ChatGPTService {
  private readonly logger = new Logger(this.constructor.name);

  @Inject(ChatGPTClient)
  private readonly client: ChatGPTClient;

  @Inject(AbortControllerProvider)
  private readonly abortController: AbortControllerProvider;

  @Inject(ConfigService)
  private readonly config: ConfigService;

  async getCompletion(chunks: string[], date: string): Promise<string[]> {
    this.logger.info(`Sending message to ChatGPT for the date '${date}'`);

    const completionParts: string[] = [];

    for (const chunk of chunks) {
      try {
        const response = await this.sendMessage(chunk);

        completionParts.push(response);
      } catch (e) {
        if (e.name === 'AbortError') {
          throw new RequestAbortedException();
        }
        this.logger.error(e);
      }
    }

    return completionParts;
  }

  @UseBackoff(BACKOFF_SEND_MESSAGE_TRIES, ['AbortError'])
  private async sendMessage(text: string): Promise<string> {
    const timeoutMs = +this.config.get('GPT_TIMEOUT_MS', 2 * 60 * 1000);

    const response = await this.client.provider.sendMessage(text, {
      timeoutMs,
      abortSignal: this.abortController.signal,
    });

    const tokenCost = +this.config.get('GPT_TOKEN_COST', 0.0003);
    const responseTokens = encode(response.text).length;
    const promptTokens = encode(text).length;

    this.logger.info(
      `Prompt chunk tokens: ${promptTokens}, GPT completed tokens: ${responseTokens}; Spent ~${
        ((responseTokens + promptTokens) / 1000) * tokenCost
      }`,
    );

    return response.text;
  }
}
