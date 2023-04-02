import {
  ChatInputCommandInteraction,
  Client,
  MessageComponentInteraction,
} from 'discord.js';
import {
  handleDailyCommandCancelling,
  handleDailyCommandInteraction,
} from './commands/daily.command.js';
import { registerSlashCommands } from './register-interactions.js';
import { BUTTON, COMMAND } from './constants.js';

export const CLIENT = new Client({
  intents: ['Guilds', 'GuildMessages'],
});

export async function initBotClient() {
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is not defined in .env');
  }

  CLIENT.once('ready', async () => {
    console.log('Bot is ready!');
    await registerSlashCommands(CLIENT);
  });

  CLIENT.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    try {
      if (interaction.commandName === COMMAND.Daily) {
        await handleDailyCommandInteraction(
          interaction as ChatInputCommandInteraction,
        );
      } else if (interaction.isMessageComponent()) {
        const componentInteraction = interaction as MessageComponentInteraction;

        if (componentInteraction.customId === BUTTON.Cancel) {
          handleDailyCommandCancelling();
        }
      }
    } catch (e) {
      console.error(e);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'Fatal error during interaction',
          ephemeral: true,
        });
      }
    }
  });

  await CLIENT.login(token);
}
