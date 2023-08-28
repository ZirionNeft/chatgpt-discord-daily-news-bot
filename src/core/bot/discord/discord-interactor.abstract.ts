import { Interaction } from 'discord.js';
import {
  BaseInteractor,
  CommandNotFoundException,
  CommandScope,
  CommandsStorage,
  ConcurrentRunException,
  FailedCommandException,
  Inject,
  InteractorsManager,
  Request,
  WrappedRequest,
} from '../../framework';
import { Logger } from '../../logger';

export abstract class DiscordInteractor<
  Request extends Interaction = Interaction,
> extends BaseInteractor<Request> {
  protected readonly logger = new Logger(this.constructor.name);

  @Inject(CommandsStorage)
  protected readonly commandsStorage: CommandsStorage;

  @Inject(InteractorsManager)
  protected readonly interactorsManager: InteractorsManager;

  async bootstrap(request: WrappedRequest<Request>) {
    const requestSelector = Request.getSelector(request);

    this.interactorsManager.getOrThrow(requestSelector);

    const commandMetadata = this.commandsStorage.get(requestSelector);
    if (commandMetadata) {
      const { concurrent, scopes } = commandMetadata;

      if (!this.isValidScope(request, scopes)) {
        throw new FailedCommandException(
          `Command should be run in scopes: ${scopes.join()}`,
        );
      }

      const trackedCount = this.commandsTracker.requestCount(requestSelector);
      if (
        (typeof concurrent === 'number' && trackedCount >= concurrent) ||
        !concurrent
      ) {
        throw new ConcurrentRunException();
      }

      this.commandsTracker.trackRequest(request);

      try {
        await this.handle(request);

        if (request.isRepliable() && request.replied) {
          await request.deleteReply();
        }
      } catch (e) {
        let content = 'Interaction processing error.';

        if (e instanceof FailedCommandException) {
          this.logger.info(e.message);
          content = e.message;
        } else {
          this.logger.error(e);
        }

        if (request.isRepliable()) {
          if (request.replied) {
            await request.editReply({
              content,
              components: [],
            });
          } else {
            await request.reply({
              content,
              components: [],
              ephemeral: true,
            });
          }
        }
      } finally {
        this.commandsTracker.forgetRequest(request);
      }
    }
    throw new CommandNotFoundException(requestSelector);
  }

  private isValidScope(request: Request, scopes: CommandScope[]) {
    return scopes.some((scope) => {
      switch (scope) {
        case 'all':
          return true;
        case 'DM':
          return request.channel.isDMBased();
        case 'text':
          return request.channel.isTextBased() && request.channel.guildId;
        case 'thread':
          return request.channel.isThread();
        case 'voice':
          return request.channel.isVoiceBased();
        default:
          return false;
      }
    });
  }
}
