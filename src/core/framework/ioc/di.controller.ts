import { InternalErrorException, isClass } from '../../common';

type Instance = Partial<OnProviderInit>;

export class DIController {
  private static readonly _tokensToProviders = new Map<ProviderToken, Type>();

  private static readonly _instances = new Map<ProviderToken, any>();

  static runFactory() {
    for (const [token, provider] of this._tokensToProviders) {
      const instance: Instance = new provider();

      const hookResult: MaybePromise<any> = instance.onProviderInit?.();
      if (hookResult instanceof Promise) {
        hookResult.catch((e) => console.error(e));
      }

      DIController._instances.set(token, instance);
    }
  }

  static register(token: ProviderToken, provider: Type) {
    if (DIController._instances.has(token)) {
      throw new InternalErrorException(
        `Duplicate provider: ${token.toString()}`,
      );
    }

    if (!isClass(provider)) {
      throw new InternalErrorException(
        `Provider without constructor: ${token.toString()}`,
      );
    }

    // const r = findCircularDependencies();

    this._tokensToProviders.set(token, provider);
  }

  static getInstanceOf<
    T extends ProviderToken = ProviderToken,
    A = T extends new (...args) => any ? InstanceType<T> : any,
  >(token: T): A {
    if (!DIController._instances.has(token)) {
      throw new InternalErrorException(
        `Requested provider is not found: ${token.toString()}`,
      );
    }

    return DIController._instances.get(token);
  }
}
