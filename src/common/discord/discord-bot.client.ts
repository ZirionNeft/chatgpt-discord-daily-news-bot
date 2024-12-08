import config from '#common/config.js';
import discordActionIdFactory from '#common/discord/discord-action-id.factory.js';
import { GuildNotFoundError } from '#common/discord/errors/GuildNotFoundError.js';
import { ListenOnce } from '#common/listener/decorators/listen-once.decorator.js';
import { Listen } from '#common/listener/decorators/listen.decorator.js';
import listenerBounderService from '#common/listener/listener-bounder.service.js';
import logger from '#common/logger.js';
import type { CommandsStorage, InteractorsStorage } from '#modules/types.js';
import type { SharedNameAndDescription } from '@discordjs/builders';
import type { Container } from '@zirion/ioc';
import type { ComponentBuilder } from 'discord.js';
import { Client, type ClientOptions, Events, type Interaction, SlashCommandBuilder } from 'discord.js';

const EVENT_TARGET = 'DiscordBotClient';

export default class DiscordBotClient {
  readonly #commandsStorage: CommandsStorage;

  readonly #container: Container;

  readonly #client: Client;

  readonly #interactorsStorage: InteractorsStorage;

  constructor(commandsStorage: CommandsStorage, interactorsStorage: InteractorsStorage, options: ClientOptions, container: Container) {
    this.#commandsStorage = commandsStorage;
    this.#interactorsStorage = interactorsStorage;
    this.#container = container;

    this.#client = new Client(options);
  }

  async start() {
    const token = config.get('DISCORD_TOKEN');

    listenerBounderService.bindListeners(this, EVENT_TARGET, this.#client);

    await this.#client.login(token);
  }

  @ListenOnce(EVENT_TARGET, Events.ClientReady)
  async ready() {
    const commands = this.#commandsStorage.entries();
    for (const [selector, meta] of commands) {
      await this.#registerActionInDiscord(meta.actionId, meta.builder(meta.actionId));

      logger.info(`Registered command [${selector}]`);
    }

    logger.info('Bot is ready!');
  }

  @Listen(EVENT_TARGET, Events.InteractionCreate)
  async interactionCreate(interaction: Interaction) {
    try {
      const actionId = discordActionIdFactory(interaction);

      const interactorType =
        this.#interactorsStorage.get(actionId);

      if (!interactorType) {
        return;
      }

      const commandAction = this.#container.get(interactorType, {
        interaction,
      });

      if (!commandAction) {
        return;
      }

      commandAction.bootstrap(interaction)
        .catch((e) => logger.error({ actionId }, `Interaction error: ${e.message}`))
        .finally(() => {
          logger.info(`Finished interaction [${actionId}]`);
        });
    } catch (e) {
      logger.error(e);
    }
  }

  async getGuild() {
    const guildId = config.get('GUILD_ID');

    const guild = await this.#client.guilds.fetch(guildId);

    if (!guild) {
      throw new GuildNotFoundError(guildId);
    }

    return guild;
  }

  async #registerActionInDiscord<
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
}
