import * as crypto from 'crypto';
import { ActionId, Id } from './constants';
import { RequestWrapper } from './interfaces';
import { ActionIdFactory } from './types';

export class Request {
  static isRequest(target: any) {
    return typeof target === 'object' && Reflect.has(target, Id);
  }

  static wrap<T extends object>(
    target: T,
    actionIdFactory: ActionIdFactory<T>,
  ) {
    Reflect.defineProperty(target, Id, {
      configurable: false,
      value: crypto.randomUUID(),
      enumerable: false,
      writable: false,
    });
    Reflect.defineProperty(target, ActionId, {
      configurable: false,
      value: null,
      enumerable: false,
      writable: true,
    });

    Reflect.defineProperty(target, 'actionId', {
      get() {
        if (this[ActionId]) {
          return this[ActionId];
        }

        this[ActionId] = actionIdFactory(target);

        return this[ActionId];
      },
    });
    Reflect.defineProperty(target, 'requestId', {
      get() {
        return target[Id];
      },
    });

    return target as RequestWrapper<T>;
  }
}
