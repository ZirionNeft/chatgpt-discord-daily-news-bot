import { Logger } from '../../../logger';
import { ProviderInstance } from '../types';
import { IScopeProxy } from './interfaces';

export class SingletoneScopeProxy<ProviderToken extends Type>
  implements IScopeProxy<ProviderToken>
{
  private readonly logger: Logger;

  private instance: ProviderInstance<ProviderToken>;

  constructor(private readonly provider: ProviderToken) {
    this.logger = new Logger(`SingletoneScopeProxy:${provider.name}`);
  }

  resolve(): ProviderInstance<ProviderToken> {
    if (this.instance) {
      return this.instance;
    }

    const instance: ProviderInstance<ProviderToken> = new this.provider();

    const hookResult: MaybePromise<any> = instance.onProviderInit?.();
    if (hookResult instanceof Promise) {
      hookResult.catch((e) => this.logger.error(e));
    }

    this.instance = instance;

    return instance;
  }
}
