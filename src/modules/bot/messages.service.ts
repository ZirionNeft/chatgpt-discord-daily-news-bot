import { FailedCommandError } from '#common/bot/command/errors/FailedCommandError.js';
import config from '#common/config.js';
import logger from '#common/logger.js';
import { cutUrlFromString } from '#common/utils/cut-url-from-string.js';
import { delay } from '#common/utils/delay.js';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Collection, Message, TextChannel } from 'discord.js';
import { type TextBasedChannel } from 'discord.js';

const DISCORD_TAGS_PATTERN =
  /<@[!&]?(\d+)>|<#(\d+)>|<@&(\d+)>|<a?:\w+:(\d+)>|<:\w+:(\d+)>/g;

const API_REQ_LIMIT = config.get(
  'DISCORD_API_REQ_LIMIT',
  100,
);

export default class MessagesService {
  async fetchMessages(
    channel: TextChannel,
    targetDate: Dayjs,
    signal?: AbortSignal,
  ) {
    const isValidMessage = (message: Message<boolean>): boolean => {
      const isSameDate = dayjs
        .utc(message.createdTimestamp)
        .isSame(targetDate, 'd');

      const isNotBot = !message.author.bot;
      const isNotEmptyMessage = !!message.content.trim().length;
      const isNotOnlyLink = cutUrlFromString(message.content).trim().length;

      return !!(isSameDate && isNotBot && isNotEmptyMessage && isNotOnlyLink);
    };

    if (!channel.lastMessageId) {
      throw new FailedCommandError('Channel has no messages to fetch from.');
    }

    const firstMessage = await channel.messages.fetch(channel.lastMessageId!);
    const targetMessages: Message[] = isValidMessage(firstMessage)
      ? [firstMessage]
      : [];
    let remainingRequests = API_REQ_LIMIT;

    const options = { limit: 100, before: channel.lastMessageId };
    let fetchedMessages: Collection<string, Message>;

    do {
      if (signal?.aborted) {
        throw new FailedCommandError('Interaction cancelled.');
      }

      if (remainingRequests == 0) {
        logger.info('Reached rate limit, waiting before continuing...');

        await delay(1000);
        remainingRequests = API_REQ_LIMIT;
      }

      fetchedMessages = await channel.messages.fetch(options);
      logger.info(
        `Fetching messages in #${channel.name} channel before message ${options.before}...`,
      );

      const msgId = fetchedMessages.last()?.id;

      if (!msgId) {
        logger.warn('No messages found');
        break;
      }

      options.before = msgId; // last message id
      remainingRequests--;

      const filteredMessages = fetchedMessages.filter(isValidMessage);

      targetMessages.push(...filteredMessages.values());

      logger.info(
        `Fetched ${fetchedMessages.size}, pushed ${filteredMessages.size}`,
      );
    } while (
      !dayjs.utc(fetchedMessages.last()?.createdAt).isBefore(targetDate, 'd')
      );

    return targetMessages.reverse();
  }

  async getChannelMessages(
    channel: TextBasedChannel,
    date: Dayjs,
    signal?: AbortSignal,
  ) {
    logger.info(
      `Breaking messages data for ${channel.id} channel into chunks`,
    );

    const messages = await this.fetchMessages(
      channel as TextChannel,
      date,
      signal,
    );

    const sanitize = async (message: Message) => {
      const contentWithoutTags = await this.#formatDiscordTags(message);
      const contentWithoutLinks = cutUrlFromString(contentWithoutTags).trim();
      return contentWithoutLinks.trim().replace(/'/g, '"');
    };

    let latestAuthor;
    return messages.reduce(async (acc, message) => {
      const sanitizedContent = await sanitize(message);

      if (!sanitizedContent.length) {
        return acc;
      }

      const result = await acc;
      if (latestAuthor !== message.author.username) {
        latestAuthor = message.author.username;

        result.push(`${message.author.username}:\n${sanitizedContent}\n`);
      } else {
        result[result.length - 1] += `${sanitizedContent}\n`;
      }

      return result;
    }, Promise.resolve<string[]>([]));
  }

  async #formatDiscordTags(message: Message) {
    let replacedStr = message.content;
    const matches = message.content.match(DISCORD_TAGS_PATTERN);

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

        if (emojiId) {
          const emoji = message.client.emojis.cache.get(emojiId);
          if (emoji) {
            replacedStr = replacedStr.replace(match, emoji.toString());
          }
        }
      }
    }

    return replacedStr;
  }
}
