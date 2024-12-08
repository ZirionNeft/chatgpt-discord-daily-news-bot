import { CommandNotFoundError } from '#common/bot/command/errors/CommandNotFoundError.js';
import { FailedCommandError } from '#common/bot/command/errors/FailedCommandError.js';
import type { CommandOptions, CommandScope } from '#common/bot/command/types.js';
import { BaseInteractor } from '#common/bot/interactor/base-interactor.abstract.js';
import logger from '#common/logger.js';
import type { CommandsStorage } from '#modules/types.js';
import type { Interaction } from 'discord.js';

export abstract class DiscordInteractor<
  Request extends Interaction = Interaction,
> extends BaseInteractor<Request> {
  readonly #commandsStorage: Map<string, CommandOptions>;
  readonly #actionId: string;

  protected constructor(commandsStorage: CommandsStorage, actionId: string) {
    super();

    this.#commandsStorage = commandsStorage;
    this.#actionId = actionId;
  }

  async bootstrap(request: Request) {
    const commandMetadata = this.#commandsStorage.get(this.#actionId);

    if (!commandMetadata) {
      throw new CommandNotFoundError(this.#actionId);
    }

    const { scopes } = commandMetadata;

    if (!request.channel) {
      throw new FailedCommandError('Command should be run in a channel.');
    }

    if (scopes?.length && !this.#isValidScope(request, scopes)) {
      throw new FailedCommandError(
        `Command should be run in scopes: ${scopes.join()}`,
      );
    }

    try {
      await this.handle(request);

      if (request.isRepliable() && request.replied) {
        await request.deleteReply();
      }
    } catch (e) {
      let content = 'Interaction processing error.';

      if (e instanceof FailedCommandError) {
        logger.info(e.message);
        content = e.message;
      } else {
        logger.error(e);
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
    }

  }

  #isValidScope(request: Request, scopes: CommandScope[]) {
    return scopes.some((scope) => {
      switch (scope) {
        case 'all':
          return true;
        case 'DM':
          return request.channel!.isDMBased();
        case 'text':
          return request.channel!.isTextBased();
        case 'thread':
          return request.channel!.isThread();
        case 'voice':
          return request.channel!.isVoiceBased();
        default:
          return false;
      }
    });
  }
}
