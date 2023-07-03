import dayjs, { Dayjs } from 'dayjs';
import { Collection, Message, TextBasedChannel, TextChannel } from 'discord.js';
import {
  ConfigService,
  cutUrlFromString,
  delay,
  Inject,
  Provider,
} from '../../core';

const DISCORD_TAGS_PATTERN =
  /<@[!&]?(\d+)>|<#(\d+)>|<@&(\d+)>|<a?:\w+:(\d+)>|<:\w+:(\d+)>/g;

@Provider()
export class MessagesService {
  private readonly _apiReqLimit: number;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  constructor() {
    this._apiReqLimit = this.configService.get<number>(
      'DISCORD_API_REQ_LIMIT',
      100,
    );
  }

  async fetchMessages(channel: TextChannel, targetDate: Dayjs) {
    const isValidMessage = (message: Message<true>) => {
      const isSameDate = dayjs
        .utc(message.createdTimestamp)
        .isSame(targetDate, 'd');
      const isNotBot = !message.author.bot;
      const isNotEmptyMessage = !!message.content.trim().length;
      const isNotOnlyLink = cutUrlFromString(message.content).trim().length;

      return isSameDate && isNotBot && isNotEmptyMessage && isNotOnlyLink;
    };

    const firstMessage = await channel.messages.fetch(channel.lastMessageId);
    const targetMessages: Message[] = isValidMessage(firstMessage)
      ? [firstMessage]
      : [];
    let remainingRequests = this._apiReqLimit;

    const options = { limit: 100, before: channel.lastMessageId };
    let fetchedMessages: Collection<string, Message>;

    do {
      if (remainingRequests == 0) {
        console.log('Reached rate limit, waiting before continuing...');

        await delay(1000);
        remainingRequests = this._apiReqLimit;
      }

      fetchedMessages = await channel.messages.fetch(options);
      console.log(
        `Fetching messages in #${channel.name} channel before message ${options.before}...`,
      );
      options.before = fetchedMessages.last()?.id; // last message id
      remainingRequests--;

      const filteredMessages = fetchedMessages.filter(isValidMessage);

      targetMessages.push(...filteredMessages.values());

      console.log(
        `Fetched ${fetchedMessages.size}, pushed ${filteredMessages.size}`,
      );
    } while (
      !dayjs.utc(fetchedMessages.last()?.createdAt).isBefore(targetDate, 'd')
    );

    return targetMessages.reverse();
  }

  async getChannelMessages(channel: TextBasedChannel, date: Dayjs) {
    console.log(`Breaking messages data for ${channel.id} channel into chunks`);

    const messages = await this.fetchMessages(channel as TextChannel, date);

    const sanitize = async (message: Message) => {
      const contentWithoutTags = await this.formatDiscordTags(message);
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

  private async formatDiscordTags(message: Message) {
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
        const emoji = message.client.emojis.cache.get(emojiId);
        if (emoji) {
          replacedStr = replacedStr.replace(match, emoji.toString());
        }
      }
    }

    return replacedStr;
  }
}
