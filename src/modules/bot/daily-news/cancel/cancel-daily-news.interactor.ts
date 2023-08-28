import { ActionRowBuilder, ButtonBuilder, ButtonInteraction } from 'discord.js';
import {
  DiscordInteractor,
  Inject,
  Interactor,
  RequestProvider,
  WrappedRequest,
} from '../../../../core';
import { CancelDailyNewsComponentId } from '../daily-news.constants';
import { CancelDailyNewsCommand } from './cancel-daily-news.command';

@Interactor({
  actionId: CancelDailyNewsComponentId,
  requestProvider: RequestProvider.DISCORD,
})
export class CancelDailyNewsInteractor<
  Request extends ButtonInteraction = ButtonInteraction,
> extends DiscordInteractor<Request> {
  @Inject(CancelDailyNewsCommand)
  private readonly cancelDailyNewsCommand: CancelDailyNewsCommand;

  async handle(request: WrappedRequest<Request>) {
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      this.cancelDailyNewsCommand.inProcessComponentBuilder,
    );

    await request.update({
      components: [row],
    });

    await this.cancelDailyNewsCommand.run();

    await request.followUp({
      content: 'Interaction cancelled.',
      ephemeral: true,
    });
  }
}
