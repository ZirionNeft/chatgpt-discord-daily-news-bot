import { ChatGPTAPI } from 'chatgpt';
import {
  ConfigService,
  Inject,
  InternalErrorException,
  Logger,
  Provider,
  ProviderInstance,
  template,
} from '../../core';
import chatGptConfig from './chatgpt.config.js';

@Provider()
export class ChatGPTClient implements ProviderInstance {
  private readonly logger = new Logger(this.constructor.name);

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  private _client: ChatGPTAPI;

  get provider() {
    if (!this._client) {
      throw new InternalErrorException('Chat GPT client is no initialized');
    }

    return this._client;
  }

  onProviderInit() {
    const apiKey = this.configService.getOrThrow('OPENAI_API_KEY');

    const model = this.configService.get('GPT_MODEL', 'gpt-3.5-turbo');
    const maxModelTokens = +this.configService.get('GPT_MODEL_TOKENS', 3950);
    const maxTokens = +this.configService.get('GPT_COMPLETION_TOKENS', 1000);
    const temperature = +this.configService.get('GPT_TEMPERATURE', 0.5);

    const language = this.configService.get('RESULT_LANGUAGE', 'English');

    const systemMessage = template(chatGptConfig.systemMessage, language);

    this.logger.info('System message is:', systemMessage);

    const nodeEnv = this.configService.get('NODE_ENV', 'production');

    this._client = new ChatGPTAPI({
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

    this.logger.info(
      `GPT Client created for model '${model}', cap tokens is ${maxModelTokens}, with temp ${temperature}`,
    );
  }
}
