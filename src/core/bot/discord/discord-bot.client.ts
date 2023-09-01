import { SharedNameAndDescription } from '@discordjs/builders';
import {
  Client,
  ClientEvents,
  ClientOptions,
  ComponentBuilder,
  Events,
  Interaction,
  SlashCommandBuilder,
} from 'discord.js';
import {
  ConfigService,
  Inject,
  InteractorsManager,
  Listen,
  ListenerBounderService,
  ListenOnce,
  Logger,
  Request,
  RequestProvider,
} from '../../../core';
import { CommandsStorage } from '../../framework';
import discordActionIdFactory from './discord-action-id.factory';
import { GuildNotFoundException } from './exceptions';
import { IBotClient } from './interfaces';

const EVENT_TARGET = 'DiscordBotClient';

export abstract class DiscordBotClient implements IBotClient<Client> {
  private readonly logger = new Logger(this.constructor.name);

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(CommandsStorage)
  private readonly commandsStorage: CommandsStorage;

  @Inject(InteractorsManager)
  private readonly interactorsManager: InteractorsManager;

  readonly provider: Client;

  constructor(options?: ClientOptions) {
    this.provider = new Client(options);
  }

  async login() {
    const token = this.configService.getOrThrow<string>('DISCORD_TOKEN');

    ListenerBounderService.bindListeners(this, EVENT_TARGET, this.provider);

    await this.provider.login(token);
  }

  @ListenOnce<AsMapped<ClientEvents>>(EVENT_TARGET, Events.ClientReady)
  async ready() {
    this.logger.info('Bot is ready!');

    const commands = this.commandsStorage.getIterator();
    for (const [selector, meta] of commands) {
      await this.registerAction(meta.actionId, meta.builder(meta.actionId));

      this.logger.info(`Registered command [${selector}]`);
    }
  }

  @Listen<AsMapped<ClientEvents>>(EVENT_TARGET, Events.InteractionCreate)
  async interactionCreate(interaction: Interaction) {
    try {
      const request = DiscordBotClient.interactionToRequest(interaction);

      await this.interactorsManager.resolve(request);
    } catch (e) {
      this.logger.fatal(e);
    }
  }

  async getGuild() {
    const guildId = this.configService.getOrThrow<string>('GUILD_ID');

    const guild = await this.provider.guilds.fetch(guildId);

    if (!guild) {
      throw new GuildNotFoundException(guildId);
    }

    return guild;
  }

  private async registerAction<
    Builder extends ComponentBuilder | SharedNameAndDescription =
      | ComponentBuilder
      | SharedNameAndDescription,
  >(actionId: string, actionBuilder: Builder) {
    if (actionBuilder instanceof SlashCommandBuilder) {
      const guild = await this.getGuild();

      const isCommandRegisteredInDiscord = guild.commands.cache.find(
        (command) => command.name === actionId,
      );

      if (!isCommandRegisteredInDiscord) {
        await guild.commands.create(actionBuilder);
      }
    }
  }

  static interactionToRequest(interaction: Interaction) {
    return Request.wrap(
      interaction,
      RequestProvider.DISCORD,
      discordActionIdFactory,
    );
  }
}
