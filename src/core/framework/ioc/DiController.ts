import { isClass } from '../../common';
import { RequestQueue } from '../request';
import { InjectScope } from './constants';
import {
  DuplicateProviderException,
  ProviderNotFoundException,
  ProviderWrongTypeException,
  UnrecognizedScopeException,
} from './exceptions';
import {
  DependencyContext,
  IScopeProxy,
  RequestDependencyContext,
  RequestScopeProxy,
  SingletoneScopeProxy,
} from './scopes';
import { ProviderInstance, ProviderToken } from './types';

export class DIController {
  private static readonly _proxyMap = new WeakMap<ProviderToken, IScopeProxy>();

  static register<Token extends ProviderToken = ProviderToken>(
    tokens: Token[],
    provider: Type,
    scope: ValueOf<typeof InjectScope>,
  ) {
    if (tokens.some((token) => DIController._proxyMap.has(token))) {
      throw new DuplicateProviderException(provider);
    }

    if (!isClass(provider)) {
      throw new ProviderWrongTypeException(provider);
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
        throw new UnrecognizedScopeException(scope, provider);
    }

    tokens.forEach((token) => this._proxyMap.set(token, proxyInstance));
  }

  static getInstanceOf<
    Token extends ProviderToken = ProviderToken,
    Provider = ProviderInstance<
      Token extends new (...any) => any ? Token : any
    >,
  >(token: Token): Provider {
    if (!DIController._proxyMap.has(token)) {
      throw new ProviderNotFoundException(token);
    }

    const proxy = DIController._proxyMap.get(token);

    const scope = DIController.getScope(token);

    const dependencyContext: DependencyContext | RequestDependencyContext = {
      providerScope: scope,
    };

    if (scope === InjectScope.REQUEST) {
      const requestQueue = this.getInstanceOf(RequestQueue);

      (dependencyContext as RequestDependencyContext).request =
        requestQueue.processing?.[0] ?? null;
    }

    return proxy.resolve(dependencyContext);
  }

  static getScope<Token extends ProviderToken = ProviderToken>(
    token: Token,
  ): ValueOf<typeof InjectScope> | null {
    const proxy = DIController._proxyMap.get(token);
    if (proxy instanceof SingletoneScopeProxy) {
      return InjectScope.SINGLETONE;
    } else if (proxy instanceof RequestScopeProxy) {
      return InjectScope.REQUEST;
    }
    return null;
  }
}
