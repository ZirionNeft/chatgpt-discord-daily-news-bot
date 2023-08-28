import { WrappedRequest } from '../../request';
import { InjectScope } from '../constants';

export interface DependencyContext {
  providerScope?: ValueOf<typeof InjectScope>;
}

export interface RequestDependencyContext<Request extends object = object>
  extends DependencyContext {
  request: WrappedRequest<Request>;
}

export interface IScopeProxy<
  ProviderToken extends Type = Type,
  Args extends any[] = any[],
> {
  resolve(
    context: DependencyContext,
    ...args: Args
  ): InstanceType<ProviderToken>;
}
