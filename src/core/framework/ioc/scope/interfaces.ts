export interface IScopeProxy<
  ProviderToken extends Type = Type,
  Args extends any[] = any[],
> {
  resolve(...args: Args): InstanceType<ProviderToken>;
}
