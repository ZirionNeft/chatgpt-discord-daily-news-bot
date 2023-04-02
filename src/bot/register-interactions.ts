import { Client } from 'discord.js';
import { dailyCommandData } from './commands/daily.command.js';

export async function registerSlashCommands(client: Client): Promise<void> {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  const existingCommand = await guild?.commands.cache.find(
    (command) => command.name === 'daily',
  );

  if (guild && !existingCommand) {
    try {
      console.log('Registering slash commands...');

      await guild.commands.create(dailyCommandData);

      console.log('Slash commands registered successfully.');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }
}
