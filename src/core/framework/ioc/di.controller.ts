import { InternalErrorException, isClass } from '../../common';
import { InjectScope } from './constants';
import { IScopeProxy, RequestScopeProxy, SingletoneScopeProxy } from './scope';
import { ProviderInstance, ProviderToken } from './types';

export class DIController {
  private static readonly _proxyMap = new Map<ProviderToken, IScopeProxy>();

  static register<Token extends ProviderToken = ProviderToken>(
    tokens: Token[],
    provider: Type,
    scope: ValueOf<typeof InjectScope>,
  ) {
    if (tokens.some((token) => DIController._proxyMap.has(token))) {
      throw new InternalErrorException(
        `Duplicate provider: ${provider.constructor.name}`,
      );
    }

    if (!isClass(provider)) {
      throw new InternalErrorException(
        `Provider without constructor: ${provider.constructor.name}`,
      );
    }

    let proxyInstance: IScopeProxy;
    switch (scope) {
      case InjectScope.SINGLETONE:
        proxyInstance = new SingletoneScopeProxy(provider);
        break;
      case InjectScope.REQUEST:
        proxyInstance = new RequestScopeProxy(provider);
        break;
      default:
        throw new InternalErrorException(
          `Unrecognized scope '${scope}' of provider '${provider.constructor.name}'`,
        );
    }

    tokens.forEach((token) => this._proxyMap.set(token, proxyInstance));
  }

  static getInstanceOf<
    Token extends ProviderToken = ProviderToken,
    Provider = ProviderInstance<
      Token extends new (...any) => any ? Token : any
    >,
  >(callerContext: ProviderInstance, token: Token): Provider {
    if (!DIController._proxyMap.has(token)) {
      throw new InternalErrorException(
        `Requested provider is not found: ${token.toString()}`,
      );
    }

    const proxy = DIController._proxyMap.get(token);

    return proxy.resolve(callerContext);
  }

  static getScope<Token extends ProviderToken = ProviderToken>(
    token: Token,
  ): ValueOf<typeof InjectScope> {
    const proxy = DIController._proxyMap.get(token);
    if (proxy instanceof SingletoneScopeProxy) {
      return InjectScope.SINGLETONE;
    } else if (proxy instanceof RequestScopeProxy) {
      return InjectScope.REQUEST;
    }
    throw new InternalErrorException(
      `Unrecognized scope for proxy instance '${proxy}'`,
    );
  }
}
