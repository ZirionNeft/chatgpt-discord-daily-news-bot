import { InternalErrorException } from '../../../common';
import { deepClone } from '../../../common/utils/deep-clone';
import { Logger } from '../../../logger';
import { RequestWrapper } from '../../request';
import { RequestAccessor } from '../constants';
import { ProviderInstance } from '../types';
import { IScopeProxy } from './interfaces';

export class RequestScopeProxy<
  Provider extends Type,
  RequestType extends object = object,
> implements
    IScopeProxy<
      Provider,
      [callerContext: ProviderInstance<Provider, RequestType>]
    >
{
  private readonly logger: Logger;

  private readonly store = new WeakMap<
    RequestWrapper<RequestType>,
    ProviderInstance<Provider>
  >();

  constructor(private readonly provider: Provider) {
    this.logger = new Logger(`RequestScopeProxy:${provider.name}`);
  }

  resolve(
    callerContext: ProviderInstance<Provider, RequestType>,
  ): ProviderInstance<Provider> {
    return new proxyfiedProvider();
  }

  private makeProxy(
    callerContextSelector: () => ProviderInstance<Provider, RequestType>,
  ) {
    const proxyfiedProvider = deepClone(this.provider);
    const proxyfiedProviderPrototype = proxyfiedProvider.prototype;

    const targetDescriptors = Object.entries(
      Object.getOwnPropertyDescriptors(proxyfiedProviderPrototype),
    );

    for (const [name, descriptor] of targetDescriptors) {
      if (name === 'constructor') {
        continue;
      }
      if (descriptor.value === 'function') {
        Reflect.defineProperty(proxyfiedProviderPrototype, name, {
          ...descriptor,
          value: new Proxy(descriptor.value, {
            apply: (_target: any, thisArg: Provider, argumentsList: any[]) => {
              const callerContext = callerContextSelector();
              const resolvedInstance = this.resolveInstance(
                callerContext[RequestAccessor],
              );
              return resolvedInstance.apply(thisArg, argumentsList);
            },
          }),
        });
      } else if (descriptor.set || descriptor.get) {
        Reflect.defineProperty(proxyfiedProviderPrototype, name, {
          ...descriptor,
          ...(descriptor.set
            ? {
                set: new Proxy(descriptor.set, {
                  apply: (
                    _target: (v: any) => void,
                    thisArg: any,
                    argArray: any[],
                  ) => {
                    const callerContext = callerContextSelector();
                    const resolvedInstance = this.resolveInstance(
                      callerContext[RequestAccessor],
                    );
                    const proxyAccessorDescriptor =
                      Reflect.getOwnPropertyDescriptor(resolvedInstance, name);
                    return proxyAccessorDescriptor.set.apply(thisArg, argArray);
                  },
                }),
              }
            : {}),
          ...(descriptor.get
            ? {
                get: new Proxy(descriptor.get, {
                  apply: (_target: () => any, thisArg: any) => {
                    const callerContext = callerContextSelector();
                    const resolvedInstance = this.resolveInstance(
                      callerContext[RequestAccessor],
                    );
                    const proxyAccessorDescriptor =
                      Reflect.getOwnPropertyDescriptor(resolvedInstance, name);
                    return proxyAccessorDescriptor.get.apply(thisArg);
                  },
                }),
              }
            : {}),
        });
      } else {
        Reflect.defineProperty(proxyfiedProviderPrototype, name, {
          ...descriptor,
          value: new Proxy(descriptor.value, {
            ...descriptor,
            set: (_target: any, p: string | symbol, newValue: any): boolean => {
              const callerContext = callerContextSelector();
              const resolvedInstance = this.resolveInstance(
                callerContext[RequestAccessor],
              );
              resolvedInstance[p] = newValue;
              return true;
            },
            get: (_target: any, p: string | symbol): any => {
              const callerContext = callerContextSelector();
              const resolvedInstance = this.resolveInstance(
                callerContext[RequestAccessor],
              );
              return resolvedInstance[p];
            },
          }),
        });
      }
    }

    return new proxyfiedProvider();
  }

  private resolveInstance(request: RequestWrapper<RequestType>) {
    if (!request) {
      throw new InternalErrorException(
        `Request scope provider should have access to Request, but it's in undefined`,
      );
    }

    if (this.store.has(request)) {
      return this.store.get(request);
    }

    const instance: ProviderInstance<Provider> = new this.provider();

    const hookResult: MaybePromise<any> = instance.onProviderInit?.();
    if (hookResult instanceof Promise) {
      hookResult.catch((e) => this.logger.error(e));
    }

    this.store.set(request, instance);

    return instance;
  }
}
