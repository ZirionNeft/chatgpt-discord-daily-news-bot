import { WeakRefCounter } from '../../../common';
import { Logger } from '../../../logger';
import { Provider } from '../../ioc';
import { Request, RequestSelector, WrappedRequest } from '../../request';

@Provider()
export class CommandRequestsTracker<Request extends object = object> {
  private readonly logger = new Logger(this.constructor.name);

  private readonly requestsMap = new Map<
    RequestSelector,
    WeakRefCounter<WrappedRequest<Request>>
  >();

  trackRequest(request: WrappedRequest<Request>) {
    const selector = Request.getSelector(request);
    if (!this.requestsMap.has(selector)) {
      this.requestsMap.set(selector, new WeakRefCounter());
    }

    this.requestsMap.get(selector).add(request);

    const { id: requestId } = Request.getMetadata(request);

    this.logger.info(
      `Command have run:\nCommand: ${selector}\nRequestId: ${requestId}`,
    );
  }

  forgetRequest(request: WrappedRequest<Request>) {
    const selector = Request.getSelector(request);
    this.requestsMap.get(selector)?.delete(request);
  }

  requestCount(selector: RequestSelector) {
    return this.requestsMap.get(selector)?.count ?? 0;
  }
}
