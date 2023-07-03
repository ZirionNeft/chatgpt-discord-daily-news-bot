import dayjs from 'dayjs';
import {
  ActionRowBuilder,
  ButtonBuilder,
  CommandInteraction,
  GuildMember,
} from 'discord.js';
import {
  BaseInteractor,
  ConfigService,
  FailedCommandException,
  getArgument,
  Inject,
  Interactor,
  InvalidDateFormatException,
  LinkCommand,
  Provider,
  Scheduled,
  TimeService,
} from '../../../../core';
import { BotClient } from '../../bot.client';
import { CancelDailyNewsCommand } from '../cancel/cancel-daily-news.command';
import { DATE_FORMAT } from '../daily-news.constants';
import { DailyNewsCommand } from './daily-news.command';

@Provider()
@Interactor()
export class DailyNewsInteractor extends BaseInteractor {
  @Inject(DailyNewsCommand)
  @LinkCommand('handleDailyNews')
  private readonly dailyNewsCommand: DailyNewsCommand;

  @Inject(CancelDailyNewsCommand)
  private readonly cancelDailyNewsCommand: CancelDailyNewsCommand;

  @Inject(BotClient)
  private readonly botClient: BotClient;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  async handleDailyNews(interaction: CommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const dateArg = getArgument<string>(interaction, 'date');
    let date = TimeService.timestamp();
    if (dateArg) {
      try {
        date = TimeService.resolveFormat(dateArg, DATE_FORMAT);
      } catch (e) {
        if (e instanceof InvalidDateFormatException) {
          await interaction.reply({
            content: e.message,
            ephemeral: true,
          });
          return;
        }

        console.error(e);

        // TODO: move to BotInteractionException with child classes
        await interaction.reply({
          content: 'Something went wrong',
          ephemeral: true,
        });
        return;
      }
    }

    if (date.isAfter(TimeService.timestamp(), 'd')) {
      await interaction.reply({
        content: 'Date should be today or before.',
        ephemeral: true,
      });
      return;
    }

    const channelId =
      getArgument<string>(interaction, 'channel') ?? interaction.channelId;

    const targetChannel = interaction.guild.channels.cache.get(channelId);
    if (!targetChannel?.isTextBased()) {
      await interaction.reply({ content: 'Invalid channel.', ephemeral: true });
      return;
    }

    if (
      !targetChannel
        .permissionsFor(interaction.member as GuildMember)
        .has('ViewChannel')
    ) {
      await interaction.reply({
        content: 'You are not permitted to see this channel.',
        ephemeral: true,
      });
      return;
    }

    if (
      !targetChannel
        .permissionsFor(interaction.guild.client.user)
        .has(['ViewChannel', 'SendMessages']) ||
      !interaction.channel
        .permissionsFor(interaction.guild.client.user)
        .has('SendMessages')
    ) {
      await interaction.reply({
        content:
          "I'm not have permissions to see and/or write in this channel.",
        ephemeral: true,
      });
      return;
    }

    // if (this.command.isRunning) {
    //   await interaction.reply({
    //     content: 'Command is running already, try a bit later',
    //     ephemeral: true,
    //   });
    //   return;
    // }

    console.log(
      `Starting daily news command handling for channel ${targetChannel} and date ${date.toISOString()}`,
    );

    try {
      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
        this.cancelDailyNewsCommand.actionBuilder,
      );

      await interaction.reply({
        content: 'Asking for ChatGPT...',
        components: [row],
        ephemeral: true,
      });

      await this.dailyNewsCommand.run(interaction.channel, targetChannel, date);

      await interaction.deleteReply();
    } catch (e) {
      console.error(e);

      let content = 'Error processing request.';
      if (e instanceof FailedCommandException) {
        content = e.message;
      }
      if (interaction.isRepliable()) {
        interaction
          .editReply({
            content,
            components: [],
          })
          .catch(console.error);
      }
    }
  }

  // TODO: unbound context
  @Scheduled('0 21 * * *')
  async runSchedulerTask() {
    console.log('Scheduled Daily News task running');

    const targetChannels = this.configService
      .get<string>('GUILD_SCHEDULED_CHANNELS', '')
      .split(',');

    const guild = await this.botClient.getGuild();

    for (const channelId of targetChannels) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel?.isTextBased()) {
        continue;
      }

      try {
        await this.dailyNewsCommand.run(channel, channel, dayjs.utc());

        console.log(`Message successfully sent to #${channel.name}`);
      } catch (e) {
        console.error(e);
      }
    }
  }
}
