export function isClass<C>(target: any): target is Type<C> {
  return typeof target === 'function' && target.constructor?.name;
}
