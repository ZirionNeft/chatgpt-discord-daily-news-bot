import { CommandRequestsTracker } from '../command';
import { Inject } from '../ioc';
import { WrappedRequest } from '../request';

export abstract class BaseInteractor<Request extends object = object> {
  @Inject(CommandRequestsTracker)
  protected readonly commandsTracker: CommandRequestsTracker<Request>;

  abstract bootstrap(request: WrappedRequest<Request>): Promise<void>;

  abstract handle(request: WrappedRequest<Request>): Promise<void>;
}
