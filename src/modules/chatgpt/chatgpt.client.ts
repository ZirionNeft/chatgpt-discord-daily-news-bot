import { ChatGPTAPI } from 'chatgpt';
import {
  ConfigService,
  Inject,
  InternalErrorException,
  Provider,
  template,
} from '../../core';
import chatGptConfig from './chatgpt.config.js';

@Provider()
export class ChatGPTClient implements OnProviderInit {
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
    const apiKey = this.configService.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new InternalErrorException('OpenAI api key is not specified');
    }

    const model = this.configService.get('GPT_MODEL', 'gpt-3.5-turbo');
    const maxModelTokens = +this.configService.get('GPT_MODEL_TOKENS', 3950);
    const maxTokens = +this.configService.get('GPT_COMPLETION_TOKENS', 1000);
    const temperature = +this.configService.get('GPT_TEMPERATURE', 0.5);

    const language = this.configService.get('RESULT_LANGUAGE', 'English');

    const systemMessage = template(chatGptConfig.systemMessage, language);

    console.info('System message is:', systemMessage);

    this._client = new ChatGPTAPI({
      apiKey,
      systemMessage,
      debug: process.env.NODE_ENV === 'development',
      completionParams: {
        model,
        temperature,
        max_tokens: maxTokens,
      },
      maxModelTokens,
    });

    console.info(
      `GPT Client created for model '${model}', cap tokens is ${maxModelTokens}, with temp ${temperature}`,
    );
  }
}
