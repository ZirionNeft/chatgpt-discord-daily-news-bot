import { ButtonStyle } from 'discord-api-types/payloads/v10';
import { ButtonBuilder } from 'discord.js';
import { BaseCommand, Inject, Provider } from '../../../../core';
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

  async run(): Promise<void> {
    this.abortController.abort();
  }

  protected componentBuilderFactory() {
    return new ButtonBuilder()
      .setCustomId(this.actionId)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);
  }
}
