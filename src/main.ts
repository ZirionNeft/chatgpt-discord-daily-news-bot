import { ChatInputCommandInteraction, Client } from 'discord.js';
import { config } from 'dotenv';
import { handleDailyCommand } from './daily.command.js';
import { registerSlashCommands } from './utils.js';

config();

const client = new Client({
  intents: ['Guilds', 'GuildMessages'],
});

client.once('ready', async () => {
  console.log('Bot is ready!');
  await registerSlashCommands(client);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'daily') {
    await handleDailyCommand(interaction as ChatInputCommandInteraction);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
