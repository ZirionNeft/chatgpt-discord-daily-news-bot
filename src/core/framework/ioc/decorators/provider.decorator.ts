import { InternalErrorException } from '../../../common';
import { Request, RequestWrapper } from '../../request';
import { InjectScope, RequestAccessor, RequestSymbol } from '../constants';
import { DIController } from '../di.controller';
import { ProviderInstance, ProviderToken } from '../types';

export function Provider(
  token?: ProviderToken,
  scope: ValueOf<typeof InjectScope> = InjectScope.SINGLETONE,
) {
  return function decorator<Target extends Type>(
    target: Target,
    _context: ClassDecoratorContext,
  ) {
    if (_context.kind === 'class') {
      Object.defineProperty(target, RequestSymbol, {
        writable: true,
        value: null,
        enumerable: false,
        configurable: false,
      });
      Object.defineProperty(target, RequestAccessor, {
        enumerable: false,
        configurable: false,
        set(request: RequestWrapper): void {
          this[RequestSymbol] = request;
        },
        get(): RequestWrapper | null {
          return this[RequestSymbol];
        },
      });

      makeProxyFunctions<Target>(target.prototype);

      const resolvedToken = token ?? target;
      DIController.register([resolvedToken], target, scope);

      return target;
    }

    throw new InternalErrorException(
      'Provider decorator can be applied only for class',
    );
  };
}

function makeProxyFunctions<T extends object>(target: T) {
  if (typeof target === 'function') {
    return;
  }

  const targetDescriptors = Object.entries(
    Object.getOwnPropertyDescriptors(target),
  );

  for (const [name, descriptor] of targetDescriptors) {
    if (
      name === 'constructor' ||
      descriptor.set ||
      descriptor.get ||
      typeof descriptor.value !== 'function'
    ) {
      continue;
    }
    Reflect.defineProperty(target, name, {
      ...descriptor,
      value: new Proxy(descriptor.value, {
        apply: targetMethodProxy,
      }),
    });
  }
}

function targetMethodProxy<Provider extends ProviderInstance>(
  target: Type<Provider>,
  thisArg: Provider,
  argumentsList: any[],
) {
  for (const arg of argumentsList) {
    if (Request.isRequest(arg)) {
      (thisArg as ProviderInstance)[RequestAccessor] = arg as RequestWrapper;
    }
  }
  const result = target.apply(thisArg, argumentsList);

  if (result instanceof Promise) {
    return result.finally(() => {
      (thisArg as ProviderInstance)[RequestAccessor] = null;
    });
  }

  (thisArg as ProviderInstance)[RequestAccessor] = null;

  return result;
}
