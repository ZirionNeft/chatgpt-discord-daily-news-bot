import { CommandInteraction, Message, TextChannel } from 'discord.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import utc from 'dayjs/plugin/utc.js';
import { config } from 'dotenv';
import { encode } from 'gpt-3-encoder';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(localizedFormat);
dayjs.extend(utc);

config();

const discordTagsRegex =
  /<@[!&]?(\d+)>|<#(\d+)>|<@&(\d+)>|<a?:\w+:(\d+)>|<:\w+:(\d+)>/g;

const localeData = await import(
  `dayjs/locale/${process.env.DAYJS_LOCALE || 'en'}.js`
);
dayjs.locale(localeData.default);

export const DATE_FORMAT = 'DD.MM.YY';

export function getValidatedDate(dateStr: string): dayjs.Dayjs | null {
  const parsedDate = dayjs(dateStr, DATE_FORMAT, true).utc(false);
  return parsedDate.isValid() ? parsedDate : null;
}

export function getArgument(interaction: CommandInteraction, name: string) {
  return interaction.options.get(name)?.value;
}

export async function replaceDiscordTags(message: Message) {
  let replacedStr = message.content;
  const matches = message.content.match(discordTagsRegex);

  if (!matches) return message;

  for (const match of matches) {
    if (match.startsWith('<@')) {
      const userId = match.replace(/[<@!>]/g, '');
      const user = await message.client.users.fetch(userId);
      if (user) {
        replacedStr = replacedStr.replace(match, `@${user.username}`);
      }
    } else if (match.startsWith('<#')) {
      const channelId = match.replace(/[<#>]/g, '');
      const channel = message.client.channels.cache.get(
        channelId,
      ) as TextChannel;
      if (channel) {
        replacedStr = replacedStr.replace(match, `#${channel.name}`);
      }
    } else if (match.startsWith('<@&')) {
      const roleId = match.replace(/[<@&>]/g, '');
      const role = message.guild?.roles.cache.get(roleId);
      if (role) {
        replacedStr = replacedStr.replace(match, `@${role.name}`);
      }
    } else if (match.startsWith('<a:')) {
      const emojiId = match.match(/<a:\w+:(\d+)>/)?.[1];
      const emoji = message.client.emojis.cache.get(emojiId);
      if (emoji) {
        replacedStr = replacedStr.replace(match, emoji.toString());
      }
    }
  }

  message.content = replacedStr;

  return message;
}

export function breakIntoChunks(data: string[], chunkSize: number): string[] {
  const result: string[] = [];
  let chunk = '';

  for (const part of data) {
    const msgWithBr = `${part}\n`;
    if (!chunk) {
      chunk = msgWithBr;
    } else {
      if (chunk.length + encode(msgWithBr).length > chunkSize) {
        result.push(chunk);
        chunk = part;
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

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
