import { RequestWrapper } from '../request';
import { RequestAccessor } from './constants';

export type ProviderToken<T = any> = symbol | string | Type<T>;

export interface OnProviderInit {
  onProviderInit(): MaybePromise<any>;
}

export interface IRequestHolder<R extends object> {
  [RequestAccessor]: RequestWrapper<R>;
}

export type ProviderInstance<
  T extends Type = Type,
  Request extends object = object,
> = InstanceType<T> & Partial<OnProviderInit> & IRequestHolder<Request>;
