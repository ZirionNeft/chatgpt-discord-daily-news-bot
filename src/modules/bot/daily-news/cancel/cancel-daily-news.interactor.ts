import { ActionRowBuilder, ButtonBuilder, ButtonInteraction } from 'discord.js';
import {
  DiscordInteractor,
  Inject,
  Interactor,
  LinkCommand,
  Provider,
  RequestWrapper,
} from '../../../../core';
import { CancelDailyNewsCommand } from './cancel-daily-news.command';

@Provider()
@Interactor()
export class CancelDailyNewsInteractor extends DiscordInteractor {
  @Inject(CancelDailyNewsCommand)
  @LinkCommand('handleCancelDailyNews', { scopes: ['text'] })
  private readonly cancelDailyNewsCommand: CancelDailyNewsCommand;

  async handleCancelDailyNews(request: RequestWrapper<ButtonInteraction>) {
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      this.cancelDailyNewsCommand.inProcessComponentBuilder,
    );

    await request.update({
      components: [row],
    });

    await this.cancelDailyNewsCommand.run(request);

    await request.followUp({
      content: 'Interaction cancelled.',
      ephemeral: true,
    });
  }
}
