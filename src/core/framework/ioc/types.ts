export type ProviderToken<T = any> = symbol | string | Type<T>;

export interface OnProviderInit {
  onProviderInit(): MaybePromise<any>;
}

export type ProviderInstance<T extends Type = Type> = InstanceType<T> &
  Partial<OnProviderInit>;
