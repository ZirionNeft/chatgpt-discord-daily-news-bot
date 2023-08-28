import { Logger } from '../../../logger';
import { WrappedRequest } from '../../request';
import { RequestUndefinedException } from '../exceptions';
import { ProviderInstance } from '../types';
import { IScopeProxy, RequestDependencyContext } from './interfaces';

export class RequestScopeProxy<Provider extends Type>
  implements IScopeProxy<Provider>
{
  private readonly logger: Logger;

  private readonly requestProviders = new WeakMap<
    WrappedRequest,
    ProviderInstance<Provider>
  >();

  constructor(private readonly provider: Provider) {
    this.logger = new Logger(`RequestScopeProxy:${provider.name}`);
  }

  resolve({ request }: RequestDependencyContext): ProviderInstance<Provider> {
    if (!request) {
      throw new RequestUndefinedException();
    }

    const resolvedDependency = this.requestProviders.get(request);

    if (!resolvedDependency) {
      const instance: ProviderInstance<Provider> = new this.provider();

      const hookResult: MaybePromise<any> = instance.onProviderInit?.();
      if (hookResult instanceof Promise) {
        hookResult.catch((e) => this.logger.error(e));
      }

      this.requestProviders.set(request, instance);

      this.logger.verbose(
        `Request (${request}) provider instance resolved for ${this.provider.name} - return the new one.`,
      );

      return instance;
    }

    this.logger.verbose(
      `Request provider instance resolved for ${this.provider.name} - return already existing.`,
    );

    return resolvedDependency;
  }
}
