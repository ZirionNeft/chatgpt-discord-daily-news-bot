import { Logger } from '../../../logger';
import { Provider } from '../../ioc';
import { WrappedRequest } from '../types';

type Value = [WrappedRequest, (request: WrappedRequest) => Promise<void>];

@Provider()
export class RequestQueue {
  readonly #logger = new Logger(this.constructor.name);

  readonly #queue: Value[] = [];

  #processing: Value = null;

  get processing(): Value {
    return this.#processing;
  }

  push(
    request: WrappedRequest,
    task: (request: WrappedRequest) => Promise<void>,
  ) {
    this.#queue.push([request, task]);

    if (!this.#processing) {
      this.#consumeNext().catch();
    }
  }

  async #consumeNext(): Promise<void> {
    for (const entry of this.#requestLoop()) {
      try {
        this.#processing = entry;
        const [request, task] = entry;

        await task(request);
      } catch (e) {
        this.#logger.error(e);
      }
    }
  }

  *#requestLoop() {
    while (this.#queue.length) {
      yield this.#queue.shift();
    }
  }
}
