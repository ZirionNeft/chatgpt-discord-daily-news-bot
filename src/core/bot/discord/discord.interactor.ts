import { Interaction } from 'discord.js';
import { InternalErrorException } from '../../common';
import {
  BaseInteractor,
  CommandScope,
  ConcurrentRunException,
  FailedCommandException,
  Provider,
  RequestWrapper,
} from '../../framework';
import { Logger } from '../../logger';

@Provider()
export class DiscordInteractor<
  Request extends Interaction = Interaction,
> extends BaseInteractor<Request> {
  protected readonly logger = new Logger(this.constructor.name);

  async bootstrap(request: RequestWrapper<Request>) {
    const actionId = request.actionId;

    if (this.commandsLinkMap.has(actionId)) {
      const {
        handlerName,
        options: { concurrent, scopes },
      } = this.commandsLinkMap.get(actionId);

      if (!this.isValidScope(request, scopes)) {
        throw new FailedCommandException(
          `Command should be run in scopes: ${scopes.join()}`,
        );
      }

      const handler = Reflect.get(this, handlerName) as (
        request: RequestWrapper<Request>,
      ) => MaybePromise<any>;

      const trackedCount = this.commandsTracker.requestCount([
        handlerName,
        actionId,
      ]);
      if (
        (typeof concurrent === 'number' && trackedCount >= concurrent) ||
        !concurrent
      ) {
        throw new ConcurrentRunException();
      }

      this.commandsTracker.trackRequest([handlerName, actionId], request);

      try {
        await handler.call(this, request);

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
        this.commandsTracker.forgetRequest([handlerName, actionId], request);
      }
    } else {
      throw new InternalErrorException('Action not implemented');
    }
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
