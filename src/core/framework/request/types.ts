import { RequestProvider } from '../interactor';
import { ProviderInstance } from '../ioc';
import { RequestAttributes } from './interfaces';

export type ActionIdFactory<Request extends InstanceType<any>> = (
  request: Request,
) => string;

export type WrappedRequest<T extends object = object> = T &
  ProviderInstance<Type<T>> &
  RequestAttributes;

export type RequestSelector = `${ValueOf<typeof RequestProvider>}:${string}`;
