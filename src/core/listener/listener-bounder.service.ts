import { EventEmitter } from 'events';
import { Logger } from '../logger';

export class ListenerBounderService {
  private static readonly logger = new Logger(ListenerBounderService);

  private static readonly listeners = new Map<
    string,
    [
      eventName: string,
      type: 'on' | 'once',
      listener: (...args: any[]) => MaybePromise<any>,
    ][]
  >();

  static register(
    targetName: string,
    eventName: string,
    type: 'on' | 'once',
    listener: (...args: any[]) => MaybePromise<any>,
  ) {
    const listeners = ListenerBounderService.listeners.get(targetName) ?? [];

    listeners.push([eventName, type, listener]);

    ListenerBounderService.listeners.set(targetName, listeners);
  }

  static bindListeners<Provider extends EventEmitter>(
    context: InstanceType<any>,
    target: string,
    eventEmitterLike: Provider,
  ) {
    if (!ListenerBounderService.listeners.has(target)) {
      return;
    }
    const listeners = ListenerBounderService.listeners.get(target);
    for (const [eventName, action, listener] of listeners) {
      eventEmitterLike[action](eventName, (...args) => {
        try {
          listener.call(context, ...args);
        } catch (e) {
          ListenerBounderService.logger.fatal(e);
        }
      });
    }
    ListenerBounderService.listeners.delete(target);
  }
}
