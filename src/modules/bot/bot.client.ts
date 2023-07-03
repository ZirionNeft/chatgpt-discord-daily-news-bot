import { Client } from 'discord.js';
import {
  ConfigService,
  Inject,
  InteractorsManager,
  InternalErrorException,
  Provider,
} from '../../core';

@Provider()
export class BotClient {
  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(InteractorsManager)
  private readonly interactorsManager: InteractorsManager;

  private readonly _client: Client;

  constructor() {
    this._client = new Client({
      intents: ['Guilds', 'GuildMessages'],
    });
  }

  async init() {
    const token = this.configService.get<string>('DISCORD_TOKEN');

    if (!token) {
      throw new InternalErrorException('Discord token is not specified');
    }

    this._client.once('ready', async () => {
      console.log('Bot is ready!');

      const registeredIds = await this.interactorsManager.registerCommands();

      console.log('Registered action ids:', registeredIds.join());
    });

    this._client.on('interactionCreate', async (interaction) => {
      try {
        const interactor = this.interactorsManager.resolve(interaction);

        await interactor.bootstrap(interaction);
      } catch (e) {
        console.error(e);
        if (interaction.isRepliable()) {
          await interaction.reply({
            content: 'Fatal error during interaction',
            ephemeral: true,
          });
        }
      }
    });

    await this._client.login(token);
  }

  async getGuild() {
    const guildId = this.configService.get<string>('GUILD_ID');
    if (!guildId) {
      throw new InternalErrorException('Guild id is not specified in .env');
    }

    const guild = await this._client.guilds.fetch(guildId);

    if (!guild) {
      throw new InternalErrorException(
        `Guild with id '${guildId}' is not found`,
      );
    }

    return guild;
  }
}
