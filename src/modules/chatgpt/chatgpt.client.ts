import config from '#common/config.js';
import logger from '#common/logger.js';
import { template } from '#common/utils/template-string.js';
import type { IOnFinalized } from '@zirion/ioc';
import { ChatGPTAPI } from 'chatgpt';

import chatGptConfig from './chatgpt.config.js';

export default class ChatGPTClient implements IOnFinalized {
  #client!: ChatGPTAPI;

  get provider() {
    if (!this.#client) {
      throw new Error('Chat GPT client is no initialized');
    }

    return this.#client;
  }

  onFinalized() {
    const apiKey = config.get('OPENAI_API_KEY');

    const model = config.get('GPT_MODEL', 'gpt-4o');
    const maxModelTokens = config.get('GPT_MODEL_TOKENS', 3950);
    const maxTokens = config.get('GPT_COMPLETION_TOKENS', 1000);
    const temperature = config.get('GPT_TEMPERATURE', 0.5);

    const language = config.get('RESULT_LANGUAGE', 'English');

    const systemMessage = template(chatGptConfig.systemMessage, language);

    logger.info('System message is:', systemMessage);

    const nodeEnv = config.get('NODE_ENV', 'production');

    this.#client = new ChatGPTAPI({
      apiKey,
      systemMessage,
      debug: nodeEnv === 'development',
      completionParams: {
        model,
        temperature,
        max_tokens: maxTokens,
      },
      maxModelTokens,
    });

    logger.info(
      `GPT Client created for model '${model}', cap tokens is ${maxModelTokens}, with temp ${temperature}`,
    );
  }
}
