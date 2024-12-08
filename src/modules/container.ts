import DiscordBotClient from '#common/discord/discord-bot.client.js';
import { DailyNewsSlashCommandName } from '#modules/bot/daily-news/constants.js';
import DailyNewsCommand, { dailyNewsCommandBuilder } from '#modules/bot/daily-news/slash-command/daily-news.command.js';
import DailyNewsInteractor from '#modules/bot/daily-news/slash-command/daily-news.interactor.js';
import MessagesService from '#modules/bot/messages.service.js';
import ChatGPTClient from '#modules/chatgpt/chatgpt.client.js';
import ChatGPTService from '#modules/chatgpt/chatgpt.service.js';
import { CommandsStore, InteractorsStore } from '#modules/constants.js';
import type { CommandsStorage, InteractorsStorage } from '#modules/types.js';
import { Container, InjectScope } from '@zirion/ioc';

const container = new Container();

await container
  .add(ChatGPTClient)
  .add(ChatGPTService, {
    inject: [ChatGPTClient],
  })
  .add(MessagesService)
  .add(CommandsStore, {
    value: () => new Map([
      [DailyNewsSlashCommandName, {
        actionId: DailyNewsSlashCommandName,
        builder: dailyNewsCommandBuilder,
        scopes: ['text'],
        token: DailyNewsCommand,
      }],
    ]) as CommandsStorage,
  })
  .add(InteractorsStore, {
    value: () => new Map([
      [DailyNewsSlashCommandName, DailyNewsInteractor],
    ]) as InteractorsStorage,
  })
  .add(DailyNewsCommand, {
    inject: [
      MessagesService,
      ChatGPTService,
    ],
  })
  .add(DiscordBotClient, {
    value: (commands, interactors) => new DiscordBotClient(commands, interactors, {
      intents: ['Guilds', 'GuildMessages'],
    }, container),
    inject: [CommandsStore, InteractorsStore],
  })
  .add(DailyNewsInteractor, {
    inject: [DiscordBotClient, DailyNewsCommand, CommandsStore],
    scope: InjectScope.REQUEST,
  })
  .finalize();


export default container;
