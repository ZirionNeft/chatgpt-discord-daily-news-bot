import { SharedNameAndDescription } from '@discordjs/builders';
import { Dayjs } from 'dayjs';
import {
  CommandInteraction,
  GuildTextBasedChannel,
  SlashCommandBuilder,
} from 'discord.js';
import { encode } from 'gpt-3-encoder';
import {
  ChunkedData,
  Command,
  ConfigService,
  delay,
  FailedCommandException,
  GptTokensStrategy,
  ICommand,
  Inject,
  InjectScope,
  Logger,
  RequestProvider,
  template,
  WrappedRequest,
} from '../../../../core';
import { ChatGPTService } from '../../../chatgpt';
import botConfig from '../../bot.config';
import { MessagesService } from '../../messages.service';
import { AbortControllerProvider } from '../abort-controller.provider';

import {
  DailyNewsSlashCommandName,
  DISCORD_MESSAGE_CHUNK_PREFIX,
} from '../daily-news.constants';

@Command<SharedNameAndDescription>({
  actionId: DailyNewsSlashCommandName,
  builder: (actionId) =>
    new SlashCommandBuilder()
      .setName(actionId)
      .setDescription(
        'Generate short digest of key topics for specific channels',
      )
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('Set channel from where content should be taken')
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName('date')
          .setDescription('The date to fetch messages from (DD.MM.YY)')
          .setRequired(false),
      ),
  scopes: ['text'],
  provider: RequestProvider.DISCORD,
  concurrent: 1,
  providerOptions: {
    scope: InjectScope.REQUEST,
  },
})
export class DailyNewsCommand implements ICommand {
  private readonly logger = new Logger(this.constructor.name);

  get actionId() {
    return DailyNewsSlashCommandName;
  }

  @Inject(MessagesService)
  private readonly messagesService: MessagesService;

  @Inject(ChatGPTService)
  private readonly chatGptService: ChatGPTService;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(AbortControllerProvider)
  private readonly abortController: AbortControllerProvider;

  async run(
    { channel }: WrappedRequest<CommandInteraction>,
    targetChannel: GuildTextBasedChannel,
    dateOption: Dayjs,
  ): Promise<void> {
    const gptModelTokens = +this.configService.get('GPT_MODEL_TOKENS', 3950);
    const gptCompletionTokens = +this.configService.get(
      'GPT_COMPLETION_TOKENS',
      1000,
    );

    const chunkSize = gptModelTokens - gptCompletionTokens;
    if (chunkSize <= 0) {
      throw new Error(`GPT chunk size is too low: ${chunkSize}`);
    }

    const messages = await this.messagesService.getChannelMessages(
      targetChannel,
      dateOption,
      this.abortController.signal,
    );

    const gptRequestChunks = ChunkedData.of(messages)
      .withSize(chunkSize)
      .using(GptTokensStrategy)
      .split();

    const formattedDateOption = dateOption.format('LL');

    if (!gptRequestChunks.length) {
      throw new FailedCommandException(
        `No messages for day '${formattedDateOption}' have been found`,
      );
    }

    const minTokensToRun = +this.configService.get(
      'MIN_TOKENS_FOR_RESULT',
      200,
    );

    if (encode(gptRequestChunks[0] ?? '').length < minTokensToRun) {
      throw new FailedCommandException(
        `History must have at least ${minTokensToRun} tokens to be analyzed`,
      );
    }

    const gptResponseChunks = await this.chatGptService.getCompletion(
      gptRequestChunks,
      formattedDateOption.toString(),
    );

    if (Array.isArray(gptResponseChunks) && gptResponseChunks.length) {
      const header = template(
        botConfig.commands[DailyNewsSlashCommandName].header,
        formattedDateOption,
        channel,
      );

      const fullContent = `${header}${gptResponseChunks.join('\n')}`;

      const discordMaxMessageLength = +this.configService.get(
        'DISCORD_MAX_MESSAGE_LENGTH',
        2000,
      );

      const data = fullContent.split('\n').map((str) => `${str}\n`);

      const chunkMessageSize =
        discordMaxMessageLength -
        header.length -
        gptResponseChunks.length -
        DISCORD_MESSAGE_CHUNK_PREFIX.length;

      const chunks = ChunkedData.of(data).withSize(chunkMessageSize).split();

      for (const chunk of chunks) {
        await channel.send({
          content: `${DISCORD_MESSAGE_CHUNK_PREFIX}${chunk}`,
        });
        await delay(300);
      }

      return;
    }

    if (typeof gptResponseChunks === 'object' && 'error' in gptResponseChunks) {
      this.logger.error(gptResponseChunks.error as string);
    } else {
      this.logger.error(
        `Unknown response error: ${JSON.stringify(gptResponseChunks)}`,
      );
    }

    throw new FailedCommandException('Empty result');
  }
}
