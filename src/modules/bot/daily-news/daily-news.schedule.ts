import config from '#common/config.js';
import type DiscordBotClient from '#common/discord/discord-bot.client.js';
import logger from '#common/logger.js';
import { Scheduled } from '#common/scheduler/scheduled.decorator.js';
import type DailyNewsCommand from '#modules/bot/daily-news/slash-command/daily-news.command.js';
import type { IOnFinalized } from '@zirion/ioc';
import dayjs from 'dayjs';

export default class DailyNewsSchedule implements IOnFinalized {
  readonly #dailyNewsCommand: DailyNewsCommand;
  readonly #botClient: DiscordBotClient;

  constructor(
    botClient: DiscordBotClient,
    dailyNewsCommand: DailyNewsCommand,
  ) {
    this.#botClient = botClient;
    this.#dailyNewsCommand = dailyNewsCommand;
  }

  onFinalized() {
    logger.info('Daily News scheduler running');
  }

  get botClient() {
    return this.#botClient;
  }

  get dailyNewsCommand() {
    return this.#dailyNewsCommand;
  }

  @Scheduled('0 21 * * *')
  async runSchedulerTask() {
    logger.info('Scheduled Daily News task running');

    const targetChannels = config
      .get('GUILD_SCHEDULED_CHANNELS', [])!;

    const guild = await this.botClient.getGuild();

    for (const channelId of targetChannels) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel?.isTextBased()) {
        continue;
      }

      try {
        await this.dailyNewsCommand.run(
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
