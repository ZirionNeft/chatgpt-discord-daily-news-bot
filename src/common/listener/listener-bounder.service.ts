import logger from '#common/logger.js';
import type { MaybePromise } from '#common/types.js';
import type { EventEmitter } from 'events';

export class ListenerBounderService {
  readonly #listeners = new Map<
    string,
    [
      eventName: string,
      type: 'on' | 'once',
      listener: (...args: any[]) => MaybePromise<any>,
    ][]
  >();

  register(
    targetName: string,
    eventName: string,
    type: 'on' | 'once',
    listener: (...args: any[]) => MaybePromise<any>,
  ) {
    const listeners = this.#listeners.get(targetName) ?? [];

    listeners.push([eventName, type, listener]);

    this.#listeners.set(targetName, listeners);
  }

  bindListeners<Provider extends EventEmitter>(
    context: InstanceType<any>,
    target: string,
    eventEmitterLike: Provider,
  ) {
    if (!this.#listeners.has(target)) {
      return;
    }
    const listeners = this.#listeners.get(target) ?? [];
    for (const [eventName, action, listener] of listeners) {
      eventEmitterLike[action](eventName, (...args) => {
        try {
          listener.call(context, ...args);
        } catch (e) {
          logger.fatal(e);
        }
      });
    }
    this.#listeners.delete(target);
  }
}

const listenerBounderService = new ListenerBounderService();

export default listenerBounderService;
