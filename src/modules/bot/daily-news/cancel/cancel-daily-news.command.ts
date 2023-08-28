import { ButtonStyle } from 'discord-api-types/v10';
import { ButtonBuilder } from 'discord.js';
import {
  Command,
  ICommand,
  Inject,
  InjectScope,
  RequestProvider,
} from '../../../../core';
import { AbortControllerProvider } from '../abort-controller.provider';
import { CancelDailyNewsComponentId } from '../daily-news.constants';

// TODO: Request Provider independence - move out from decorator options to another place discord-specific logic
@Command<ButtonBuilder>({
  actionId: CancelDailyNewsComponentId,
  builder: (actionId) =>
    new ButtonBuilder()
      .setCustomId(actionId)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  provider: RequestProvider.DISCORD,
  providerOptions: { scope: InjectScope.REQUEST },
})
export class CancelDailyNewsCommand implements ICommand {
  @Inject(AbortControllerProvider)
  private readonly abortController: AbortControllerProvider;

  private _inProcessComponentBuilder: ButtonBuilder;

  get actionId() {
    return CancelDailyNewsComponentId;
  }

  get inProcessComponentBuilder() {
    if (!this._inProcessComponentBuilder) {
      this._inProcessComponentBuilder = this.inProcessComponentBuilderFactory();
    }
    return this._inProcessComponentBuilder;
  }

  async run(): Promise<void> {
    this.abortController.abort();
  }

  protected inProcessComponentBuilderFactory() {
    return new ButtonBuilder()
      .setCustomId('cancelling')
      .setLabel('Cancelling...')
      .setDisabled(true)
      .setStyle(ButtonStyle.Danger);
  }
}
