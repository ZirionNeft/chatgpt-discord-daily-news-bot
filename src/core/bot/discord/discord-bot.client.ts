import {
  Client,
  ClientEvents,
  Events,
  Interaction,
  SlashCommandBuilder,
} from 'discord.js';
import {
  BaseCommand,
  ConfigService,
  Inject,
  InteractorsManager,
  InternalErrorException,
  Listen,
  ListenerBounderService,
  ListenOnce,
  Logger,
  Request,
} from '../../../core';
import discordActionIdFactory from './discord-action-id.factory';
import { IBotClient } from './interfaces';

const EVENT_TARGET = 'DiscordBotClient';

export abstract class DiscordBotClient implements IBotClient<Client> {
  private readonly logger = new Logger(this.constructor.name);

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(InteractorsManager)
  private readonly interactorsManager: InteractorsManager;

  readonly provider = new Client({
    intents: ['Guilds', 'GuildMessages'],
  });

  async login() {
    const token = this.configService.getOrThrow<string>('DISCORD_TOKEN');

    ListenerBounderService.bindListeners(this, EVENT_TARGET, this.provider);

    await this.provider.login(token);
  }

  @ListenOnce<AsMapped<ClientEvents>>(EVENT_TARGET, Events.ClientReady)
  async ready() {
    this.logger.info('Bot is ready!');

    const registeredIds = await this.interactorsManager.registerCommands();

    this.logger.info('Registered action ids:', registeredIds.join());
  }

  @Listen<AsMapped<ClientEvents>>(EVENT_TARGET, Events.InteractionCreate)
  async interactionCreate(interaction: Interaction) {
    try {
      const request = Request.wrap(interaction, discordActionIdFactory);

      const interactor = this.interactorsManager.resolve(request);

      await interactor.bootstrap(request);
    } catch (e) {
      this.logger.fatal(e);
    }
  }

  async getGuild() {
    const guildId = this.configService.getOrThrow<string>('GUILD_ID');

    const guild = await this.provider.guilds.fetch(guildId);

    if (!guild) {
      throw new InternalErrorException(
        `Guild with id '${guildId}' is not found`,
      );
    }

    return guild;
  }

  async registerAction({ actionBuilder, actionId }: BaseCommand) {
    if (!actionId) {
      throw new InternalErrorException('Action id is not defined');
    }

    if (actionBuilder instanceof SlashCommandBuilder) {
      const guild = await this.getGuild();

      const isCommandRegisteredInDiscord = await guild.commands.cache.find(
        (command) => command.name === actionId,
      );

      if (!isCommandRegisteredInDiscord) {
        await guild.commands.create(actionBuilder);
      }
    }
  }
}
