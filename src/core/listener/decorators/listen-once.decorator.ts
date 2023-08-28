import { EventEmitter } from 'events';
import { ListenerBounderService } from '../listener-bounder.service';

export function ListenOnce<
  Events extends Record<string, [...any[]]>,
  K extends keyof Events = keyof Events,
>(target: string, eventName: K) {
  return function actualDecorator<TThis extends EventEmitter>(
    originalMethod: (...args: Events[K]) => void,
    _context: ClassMethodDecoratorContext,
  ) {
    if (typeof _context.name === 'symbol') {
      throw new Error('Cannot decorate method of symbol target');
    }
    ListenerBounderService.register(
      target,
      eventName as string,
      'once',
      originalMethod,
    );
    return function replacementMethod(this: TThis, ...args: Events[K]) {
      return originalMethod.call(this, ...args);
    };
  };
}
