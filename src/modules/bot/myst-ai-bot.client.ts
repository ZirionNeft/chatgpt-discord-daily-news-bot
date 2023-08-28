import { DiscordBotClient, Provider } from '../../core';

@Provider()
export class MystAIBot extends DiscordBotClient {
  constructor() {
    super({
      intents: ['Guilds', 'GuildMessages'],
    });
  }
}
