import { Client, CommandInteraction, REST, Routes } from 'discord.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import { config } from 'dotenv';
import { encode } from 'gpt-3-encoder';
import { dailyCommandData } from './daily.command.js';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(localizedFormat);

config();

const localeData = await import(
  `dayjs/locale/${process.env.DAYJS_LOCALE || 'en'}.js`
);
dayjs.locale(localeData.default);

export const DATE_FORMAT = 'DD-MM-YYYY';

export const MAX_TOKENS = 2048; // maximum number of tokens for ChatGPT 3.5

export function validateDate(dateStr: string): dayjs.Dayjs | null {
  const parsedDate = dayjs(dateStr, DATE_FORMAT, true);
  return parsedDate.isValid() ? parsedDate : null;
}

export function getArgument(interaction: CommandInteraction, name: string) {
  return interaction.options.get(name).value;
}

export function breakIntoChunks(messages: string[]): string[] {
  const result: string[] = [];
  let chunk = '';

  for (const message of messages) {
    const msgWithBr = `${message}\n`;
    if (!chunk) {
      chunk = msgWithBr;
    } else {
      if (encode(message).length > MAX_TOKENS) {
        result.push(chunk);
        chunk = message;
      } else {
        chunk += msgWithBr;
      }
    }
  }

  if (chunk.length > 0) {
    result.push(chunk);
  }

  return result;
}

export async function registerSlashCommands(client: Client): Promise<void> {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  const existingCommand = await guild?.commands.cache.find(
    (command) => command.name === 'daily',
  );

  if (guild && !existingCommand) {
    try {
      console.log('Registering slash commands...');

      const rest = new REST({ version: '10' }).setToken(
        process.env.DISCORD_TOKEN,
      );

      await rest.delete(
        Routes.applicationGuildCommand(
          '729372307897712740',
          guild.id,
          '1088983275483181158',
        ),
      );
      await rest.delete(
        Routes.applicationGuildCommand(
          '729372307897712740',
          guild.id,
          '1088902377878335658',
        ),
      );

      await guild.commands.create(dailyCommandData);

      console.log('Slash commands registered successfully.');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }
}
