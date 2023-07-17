import { ButtonStyle } from 'discord-api-types/payloads/v10';
import { ButtonBuilder, ButtonInteraction } from 'discord.js';
import {
  BaseCommand,
  Inject,
  Provider,
  RequestWrapper,
} from '../../../../core';
import { AbortControllerProvider } from '../abort-controller.provider';
import { CancelDailyNewsComponentId } from '../daily-news.constants';

@Provider()
export class CancelDailyNewsCommand extends BaseCommand<ButtonBuilder> {
  readonly actionId = CancelDailyNewsComponentId;

  @Inject(AbortControllerProvider)
  private readonly abortController: AbortControllerProvider;

  constructor() {
    super();
  }

  private _inProcessComponentBuilder: ButtonBuilder;

  get inProcessComponentBuilder() {
    if (!this._inProcessComponentBuilder) {
      this._inProcessComponentBuilder = this.inProcessComponentBuilderFactory();
    }
    return this._inProcessComponentBuilder;
  }

  async run(_request: RequestWrapper<ButtonInteraction>): Promise<void> {
    this.abortController.abort();
  }

  protected inProcessComponentBuilderFactory() {
    return new ButtonBuilder()
      .setCustomId('cancelling')
      .setLabel('Cancelling...')
      .setDisabled(true)
      .setStyle(ButtonStyle.Danger);
  }

  protected componentBuilderFactory() {
    return new ButtonBuilder()
      .setCustomId(this.actionId)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);
  }
}
