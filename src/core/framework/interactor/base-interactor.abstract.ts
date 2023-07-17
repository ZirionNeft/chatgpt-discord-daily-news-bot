import {
  BaseCommand,
  CommandOptions,
  CommandRequestsTracker,
} from '../command';
import { Inject } from '../ioc';
import { RequestWrapper } from '../request';

export interface LinkedCommandData {
  type: Type<BaseCommand>;
  handlerName: string;
  options?: CommandOptions;
}

export abstract class BaseInteractor<Request extends object = object> {
  @Inject(CommandRequestsTracker)
  protected readonly commandsTracker: CommandRequestsTracker<Request>;

  readonly commandsLinkMap = new Map<string, LinkedCommandData>();

  abstract bootstrap(request: RequestWrapper<Request>): Promise<void>;
}
