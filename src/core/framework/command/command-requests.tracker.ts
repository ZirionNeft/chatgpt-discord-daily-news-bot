import { WeakRefCounter } from '../../common';
import { Logger } from '../../logger';
import { Provider } from '../ioc';
import { RequestWrapper } from '../request';
import { Selector } from './types';

@Provider()
export class CommandRequestsTracker<Request extends object = object> {
  private readonly logger = new Logger(this.constructor.name);

  private readonly requestsMap = new Map<
    Selector,
    WeakRefCounter<RequestWrapper<Request>>
  >();

  trackRequest(selector: Selector, request: RequestWrapper<Request>) {
    if (!this.requestsMap.has(selector)) {
      this.requestsMap.set(selector, new WeakRefCounter());
    }

    this.requestsMap.get(selector).add(request);

    this.logger.info(
      `Command have run:\nCommand: ${request.actionId}\nRequestId: ${request.requestId}`,
    );
  }

  forgetRequest(selector: Selector, request: RequestWrapper<Request>) {
    this.requestsMap.get(selector)?.delete(request);
  }

  requestCount(selector: Selector) {
    return this.requestsMap.get(selector)?.count ?? 0;
  }
}
