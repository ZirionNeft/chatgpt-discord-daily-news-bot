import type { MaybePromise } from '#common/types.js';
import type { EventEmitter } from 'events';
import listenerBounderService from '../listener-bounder.service.js';

export function ListenOnce(target: string, eventName: string) {
  return function actualDecorator<TThis extends EventEmitter>(
    originalMethod: (...args: any[]) => MaybePromise<any>,
    _context: ClassMethodDecoratorContext,
  ) {
    if (typeof _context.name === 'symbol') {
      throw new Error('Cannot decorate method of symbol target');
    }
    listenerBounderService.register(
      target,
      eventName as string,
      'once',
      originalMethod,
    );
    return function replacementMethod(this: TThis, ...args: any[]) {
      return originalMethod.call(this, ...args);
    };
  };
}
