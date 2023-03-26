import { ChatInputCommandInteraction, Client } from 'discord.js';
import { config } from 'dotenv';
import { handleDailyCommandInteraction } from './daily.command.js';
import { registerSlashCommands } from './utils.js';

config();

export const CLIENT = new Client({
  intents: ['Guilds', 'GuildMessages'],
});

CLIENT.once('ready', async () => {
  console.log('Bot is ready!');
  await registerSlashCommands(CLIENT);
});

CLIENT.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    if (interaction.commandName === 'daily') {
      await handleDailyCommandInteraction(
        interaction as ChatInputCommandInteraction,
      );
    }
  } catch (e) {
    console.error(e);
    if (interaction.isRepliable()) {
      interaction.reply({
        content: 'Fatal error during interaction',
      });
    }
  }
});

CLIENT.login(process.env.DISCORD_BOT_TOKEN);
