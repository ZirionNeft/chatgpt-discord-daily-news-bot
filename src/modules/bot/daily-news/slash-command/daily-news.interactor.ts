import dayjs from 'dayjs';
import {
  ActionRowBuilder,
  ButtonBuilder,
  CommandInteraction,
  GuildMember,
  GuildTextBasedChannel,
} from 'discord.js';
import {
  ConfigService,
  DiscordInteractor,
  getArgument,
  Inject,
  Interactor,
  LinkCommand,
  Provider,
  Request,
  RequestWrapper,
  Scheduled,
  TimeService,
} from '../../../../core';
import discordActionIdFactory from '../../../../core/bot/discord/discord-action-id.factory';
import {
  InsufficientPermissionsException,
  InvalidDateFormatException,
} from '../../exceptions';
import { MystAIBot } from '../../myst-ai-bot.client';
import { CancelDailyNewsCommand } from '../cancel';
import { DATE_FORMAT } from '../daily-news.constants';
import { DailyNewsCommand } from './daily-news.command';

@Provider()
@Interactor()
export class DailyNewsInteractor extends DiscordInteractor {
  @Inject(DailyNewsCommand)
  @LinkCommand('handleDailyNews', { concurrent: 1, scopes: ['text'] })
  private readonly dailyNewsCommand: DailyNewsCommand;

  @Inject(CancelDailyNewsCommand)
  private readonly cancelDailyNewsCommand: CancelDailyNewsCommand;

  @Inject(MystAIBot)
  private readonly botClient: MystAIBot;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  async handleDailyNews(request: RequestWrapper<CommandInteraction>) {
    const dateArg = getArgument<string>(request, 'date');
    let date = TimeService.timestamp();
    if (dateArg) {
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

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      this.cancelDailyNewsCommand.actionBuilder,
    );

    await request.reply({
      content: 'Asking for ChatGPT...',
      components: [row],
      ephemeral: true,
    });

    await this.dailyNewsCommand.run(request, targetChannel, date);
  }

  @Scheduled(DailyNewsInteractor, '0 21 * * *')
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
        const requestLike = Request.wrap(
          { channel } as any,
          discordActionIdFactory,
        );

        await this.dailyNewsCommand.run(requestLike, channel, dayjs.utc());

        this.logger.info(`Message successfully sent to #${channel.name}`);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}
