import config from '#common/config.js';
import type DiscordBotClient from '#common/discord/discord-bot.client.js';
import { DiscordInteractor } from '#common/discord/discord-interactor.abstract.js';
import { getArgument } from '#common/discord/get-argument.js';
import type { BotCommandContext } from '#common/discord/types.js';
import logger from '#common/logger.js';
import { Scheduled } from '#common/scheduler/scheduled.decorator.js';
import timeService from '#common/time.js';
import type DailyNewsCommand from '#modules/bot/daily-news/slash-command/daily-news.command.js';
import { InsufficientPermissionsError } from '#modules/bot/errors/InsufficientPermissionsError.js';
import { InvalidDateFormatError } from '#modules/bot/errors/InvalidDateFormatError.js';
import type { CommandsStorage } from '#modules/types.js';
import dayjs from 'dayjs';
import type { ChatInputCommandInteraction, GuildMember, GuildTextBasedChannel } from 'discord.js';
import { DailyNewsSlashCommandName, DATE_FORMAT } from '../constants.js';

export default class DailyNewsInteractor<
  Request extends ChatInputCommandInteraction = ChatInputCommandInteraction,
> extends DiscordInteractor<Request> {

  readonly #dailyNewsCommand: DailyNewsCommand;
  readonly #botClient: DiscordBotClient;
  readonly #context: BotCommandContext;

  constructor(
    botClient: DiscordBotClient,
    dailyNewsCommand: DailyNewsCommand,
    commandsStorage: CommandsStorage,
    context: BotCommandContext,
  ) {
    super(commandsStorage, DailyNewsSlashCommandName);

    this.#botClient = botClient;
    this.#dailyNewsCommand = dailyNewsCommand;
    this.#context = context;
  }

  async handle() {
    const request = this.#context.interaction;

    const dateArg = getArgument<string>(request, 'date');
    let date = timeService.timestamp();
    if (dateArg) {
      // TODO: Date like 12.05.2023 not having to throw
      date = timeService.resolveFormat(dateArg, DATE_FORMAT);
      if (!date.isValid()) {
        throw new InvalidDateFormatError(date, DATE_FORMAT);
      }
    }

    if (date.isAfter(timeService.timestamp(), 'd')) {
      await request.reply({
        content: 'Date should be today or before.',
        ephemeral: true,
      });
      return;
    }

    const channelId =
      getArgument<string>(request, 'channel') ?? request.channelId;

    if (!request.guild || !request.channel) {
      throw new Error('Guild is not defined for this request');
    }

    const targetChannel = request.guild.channels.cache.get(
      channelId,
    ) as GuildTextBasedChannel;

    if (
      !targetChannel
        .permissionsFor(request.member as GuildMember)
        .has('ViewChannel')
    ) {
      throw new InsufficientPermissionsError();
    }

    if (
      !targetChannel.permissionsFor(request.guild.client.user)?.has(['ViewChannel', 'SendMessages'])
    ) {
      await request.reply({
        content:
          'I\'m not have permissions to see and/or write in this channel.',
        ephemeral: true,
      });
      return;
    }

    logger.info(
      `Starting daily news command handling for channel ${targetChannel} and date ${date.toISOString()}`,
    );

    await request.reply({
      content: 'Asking for ChatGPT...',
      ephemeral: true,
    });

    await this.#dailyNewsCommand.run(request, targetChannel, date);
  }

  @Scheduled('0 21 * * *')
  async runSchedulerTask() {
    logger.info('Scheduled Daily News task running');

    const targetChannels = config
      .get('GUILD_SCHEDULED_CHANNELS', [])!;

    const guild = await this.#botClient.getGuild();

    for (const channelId of targetChannels) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel?.isTextBased()) {
        continue;
      }

      try {
        await this.#dailyNewsCommand.run(
          { channel } as any,
          channel,
          dayjs.utc(),
        );

        logger.info(`Message successfully sent to #${channel.name}`);
      } catch (e) {
        logger.error(e);
      }
    }
  }
}
