import dayjs from 'dayjs';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  GuildTextBasedChannel,
} from 'discord.js';
import {
  ConfigService,
  DiscordInteractor,
  getArgument,
  Inject,
  Interactor,
  Request,
  RequestProvider,
  Scheduled,
  TimeService,
  WrappedRequest,
} from '../../../../core';
import {
  InsufficientPermissionsException,
  InvalidDateFormatException,
} from '../../exceptions';
import { MystAIBot } from '../../myst-ai-bot.client';
import { CancelDailyNewsCommand } from '../cancel';
import {
  DailyNewsSlashCommandName,
  DATE_FORMAT,
} from '../daily-news.constants';
import { DailyNewsCommand } from './daily-news.command';

@Interactor({
  actionId: DailyNewsSlashCommandName,
  requestProvider: RequestProvider.DISCORD,
})
export class DailyNewsInteractor<
  Request extends ChatInputCommandInteraction = ChatInputCommandInteraction,
> extends DiscordInteractor<Request> {
  @Inject(DailyNewsCommand)
  private readonly dailyNewsCommand: DailyNewsCommand;

  @Inject(CancelDailyNewsCommand)
  private readonly cancelDailyNewsCommand: CancelDailyNewsCommand;

  @Inject(MystAIBot)
  private readonly botClient: MystAIBot;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  async handle(request: WrappedRequest<Request>) {
    const dateArg = getArgument<string>(request, 'date');
    let date = TimeService.timestamp();
    if (dateArg) {
      // TODO: Date like 12.05.2023 not having to throw
      date = TimeService.resolveFormat(dateArg, DATE_FORMAT);
      if (!date.isValid()) {
        throw new InvalidDateFormatException(date, DATE_FORMAT);
      }
    }

    if (date.isAfter(TimeService.timestamp(), 'd')) {
      await request.reply({
        content: 'Date should be today or before.',
        ephemeral: true,
      });
      return;
    }

    const channelId =
      getArgument<string>(request, 'channel') ?? request.channelId;

    const targetChannel = request.guild.channels.cache.get(
      channelId,
    ) as GuildTextBasedChannel;

    if (
      !targetChannel
        .permissionsFor(request.member as GuildMember)
        .has('ViewChannel')
    ) {
      throw new InsufficientPermissionsException();
    }

    // TODO: move check for bot permissions to discord interactor
    if (
      !targetChannel
        .permissionsFor(request.guild.client.user)
        .has(['ViewChannel', 'SendMessages']) ||
      !request.channel
        .permissionsFor(request.guild.client.user)
        .has('SendMessages')
    ) {
      await request.reply({
        content:
          "I'm not have permissions to see and/or write in this channel.",
        ephemeral: true,
      });
      return;
    }

    this.logger.info(
      `Starting daily news command handling for channel ${targetChannel} and date ${date.toISOString()}`,
    );

    const selector = Request.getSelector(request);
    const buttonBuilder = this.commandsStorage
      .get(selector)
      .builder(this.cancelDailyNewsCommand.actionId) as ButtonBuilder;

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      buttonBuilder,
    );

    await request.reply({
      content: 'Asking for ChatGPT...',
      components: [row],
      ephemeral: true,
    });

    await this.dailyNewsCommand.run(request, targetChannel, date);
  }

  @Scheduled('0 21 * * *')
  async runSchedulerTask() {
    this.logger.info('Scheduled Daily News task running');

    // TODO: validate bot permissions for every channel
    const targetChannels = this.configService
      .get<string>('GUILD_SCHEDULED_CHANNELS', '')
      .split(',');

    const guild = await this.botClient.getGuild();

    for (const channelId of targetChannels) {
      const channel = guild.channels.cache.get(channelId);
      // TODO: move validation to another layer (before command run?), also from discord interactor
      if (!channel?.isTextBased()) {
        continue;
      }

      try {
        await this.dailyNewsCommand.run(
          { channel } as any,
          channel,
          dayjs.utc(),
        );

        this.logger.info(`Message successfully sent to #${channel.name}`);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}
