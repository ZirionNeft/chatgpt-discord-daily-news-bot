import { FailedCommandError } from '#common/bot/command/errors/FailedCommandError.js';
import type { ICommand } from '#common/bot/command/types.js';
import ChunkedData, { GptTokensStrategy } from '#common/chunked-data-builder.js';
import config from '#common/config.js';
import logger from '#common/logger.js';
import { delay } from '#common/utils/delay.js';
import { template } from '#common/utils/template-string.js';
import botConfig from '#modules/bot/bot.config.js';
import type MessagesService from '#modules/bot/messages.service.js';
import type ChatGPTService from '#modules/chatgpt/chatgpt.service.js';
import type { Dayjs } from 'dayjs';
import type { CommandInteraction } from 'discord.js';
import { type GuildTextBasedChannel, SlashCommandBuilder } from 'discord.js';
import { encode } from 'gpt-3-encoder';
import { DailyNewsSlashCommandName, DISCORD_MESSAGE_CHUNK_PREFIX } from '../constants.js';

export const dailyNewsCommandBuilder = (actionId: string) =>
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
    );

export default class DailyNewsCommand implements ICommand {

  readonly #messagesService: MessagesService;
  readonly #chatGptService: ChatGPTService;

  constructor(
    messagesService: MessagesService,
    chatGptService: ChatGPTService,
  ) {
    this.#messagesService = messagesService;
    this.#chatGptService = chatGptService;
  }

  async run(
    { channel }: CommandInteraction,
    targetChannel: GuildTextBasedChannel,
    dateOption: Dayjs,
  ): Promise<void> {
    const gptModelTokens = config.get('GPT_MODEL_TOKENS', 3950);
    const gptCompletionTokens = config.get(
      'GPT_COMPLETION_TOKENS',
      1000,
    );

    if (!channel) {
      throw new Error('Channel is not defined');
    }

    if (!channel.isSendable()) {
      throw new Error('Channel is not sendable');
    }

    const chunkSize = gptModelTokens - gptCompletionTokens;
    if (chunkSize <= 0) {
      throw new Error(`GPT chunk size is too low: ${chunkSize}`);
    }

    const messages = await this.#messagesService.getChannelMessages(
      targetChannel,
      dateOption,
    );

    const gptRequestChunks = ChunkedData.of(messages)
      .withSize(chunkSize)
      .using(GptTokensStrategy)
      .split();

    const formattedDateOption = dateOption.format('LL');

    if (!gptRequestChunks.length) {
      throw new FailedCommandError(
        `No messages for day '${formattedDateOption}' have been found`,
      );
    }

    const minTokensToRun = config.get(
      'GPT_MIN_TOKENS_TO_ANALYZE',
      200,
    )!;

    if (encode(gptRequestChunks[0] ?? '').length < minTokensToRun) {
      throw new FailedCommandError(
        `History must have at least ${minTokensToRun} tokens to be analyzed`,
      );
    }

    const gptResponseChunks = await this.#chatGptService.getCompletion(
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

      const discordMaxMessageLength = config.get(
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
      logger.error(gptResponseChunks.error as string);
    } else {
      logger.error(
        `Unknown response error: ${JSON.stringify(gptResponseChunks)}`,
      );
    }

    throw new FailedCommandError('Empty result');
  }
}
