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
export const urlRegex =
  /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/gi;

const localeData = await import(
  `dayjs/locale/${process.env.DAYJS_LOCALE || 'en'}.js`
);
dayjs.locale(localeData.default);

export const DATE_FORMAT = 'DD.MM.YY';

export function getValidatedDate(dateStr: string): dayjs.Dayjs | null {
  const parsedDate = dayjs.utc(dateStr, DATE_FORMAT);
  return parsedDate.isValid() ? parsedDate : null;
}

export function getArgument(interaction: CommandInteraction, name: string) {
  return interaction.options.get(name)?.value;
}

export async function replaceDiscordTags(message: Message) {
  let replacedStr = message.content;
  const matches = message.content.match(discordTagsRegex);

  if (!matches) return replacedStr;

  for (const match of matches) {
    if (match.startsWith('<@')) {
      if (match.startsWith('<@&')) {
        const roleId = match.replace(/[<@&>]/g, '');
        const role = message.guild?.roles.cache.get(roleId);
        if (role) {
          replacedStr = replacedStr.replace(match, `@${role.name}`);
        }
      } else {
        const userId = match.replace(/[<@!>]/g, '');
        const user = await message.client.users.fetch(userId);
        if (user) {
          replacedStr = replacedStr.replace(match, `@${user.username}`);
        }
      }
    } else if (match.startsWith('<#')) {
      const channelId = match.replace(/[<#>]/g, '');
      const channel = message.client.channels.cache.get(
        channelId,
      ) as TextChannel;
      if (channel) {
        replacedStr = replacedStr.replace(match, `#${channel.name}`);
      }
    } else if (match.startsWith('<a:')) {
      const emojiId = match.match(/<a:\w+:(\d+)>/)?.[1];
      const emoji = message.client.emojis.cache.get(emojiId);
      if (emoji) {
        replacedStr = replacedStr.replace(match, emoji.toString());
      }
    }
  }

  return replacedStr;
}

export function removeLinks(text: string) {
  return text.replaceAll(urlRegex, '');
}

export function breakIntoChunks(data: string[], chunkSize: number): string[] {
  const result: string[] = [];
  let chunk = '';

  for (const part of data) {
    if (!chunk) {
      chunk = part;
    } else {
      if (chunk.length + encode(part).length > chunkSize) {
        result.push(chunk.trim());
        chunk = part;
      } else {
        chunk += part;
      }
    }
  }

  if (chunk.length > 0) {
    result.push(chunk.trim());
  }

  return result;
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
