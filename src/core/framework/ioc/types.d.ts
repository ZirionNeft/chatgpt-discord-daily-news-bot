type ProviderToken<T = any> = symbol | string | Type<T>;

interface OnProviderInit {
  onProviderInit(): MaybePromise<any>;
}
