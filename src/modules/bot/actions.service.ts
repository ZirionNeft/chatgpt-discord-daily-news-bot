import { SlashCommandBuilder } from 'discord.js';
import {
  BaseCommand,
  Inject,
  InternalErrorException,
  Provider,
} from '../../core';
import { BotClient } from './bot.client';

@Provider()
export class ActionsService {
  @Inject(BotClient)
  private readonly botClient;

  async registerAction({ actionBuilder, actionId }: BaseCommand) {
    if (!actionId) {
      throw new InternalErrorException('Action id is not defined');
    }

    if (actionBuilder instanceof SlashCommandBuilder) {
      const guild = await this.botClient.getGuild();

      const isCommandRegisteredInDiscord = await guild.commands.cache.find(
        (command) => command.name === actionId,
      );

      if (!isCommandRegisteredInDiscord) {
        await guild.commands.create(actionBuilder);
      }
    }
  }
}
