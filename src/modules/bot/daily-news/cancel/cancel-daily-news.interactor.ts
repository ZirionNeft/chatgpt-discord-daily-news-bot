import { ButtonInteraction } from 'discord.js';
import {
  BaseInteractor,
  FailedCommandException,
  Inject,
  Interactor,
  LinkCommand,
  Provider,
} from '../../../../core';
import { CancelDailyNewsCommand } from './cancel-daily-news.command';

@Provider()
@Interactor()
export class CancelDailyNewsInteractor extends BaseInteractor {
  @Inject(CancelDailyNewsCommand)
  @LinkCommand('handleCancelDailyNews')
  private readonly cancelDailyNewsCommand: CancelDailyNewsCommand;

  async handleCancelDailyNews(interaction: ButtonInteraction) {
    try {
      await this.cancelDailyNewsCommand.run();

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
}
