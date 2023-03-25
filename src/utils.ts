import {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
} from 'discord.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import { config } from 'dotenv';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

config();

export function validateDate(dateStr: string): dayjs.Dayjs | null {
  const parsedDate = dayjs(dateStr, 'DD-MM-YYYY', true);
  return parsedDate.isValid() ? parsedDate : null;
}

export function getArgument(
  interaction: ChatInputCommandInteraction,
  name: string,
): string | undefined {
  return interaction.options.getString(name);
}

export async function registerSlashCommands(client: Client): Promise<void> {
  const dailyCommandData = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Fetch daily messages and analyze them')
    .addStringOption((option) =>
      option
        .setName('date')
        .setDescription('The date to fetch messages from (DD-MM-YYYY)')
        .setRequired(false),
    );

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const existingCommand = await guild.commands.cache.find(
    (command) => command.name === 'daily',
  );

  if (!existingCommand) {
    try {
      console.log('Registering slash commands...');
      await guild.commands.create(dailyCommandData);
      console.log('Slash commands registered successfully.');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }
}
