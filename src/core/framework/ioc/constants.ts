export const InjectScope = {
  SINGLETONE: 'SINGLETONE',
  REQUEST: 'REQUEST',
} as const;

export const RequestSymbol = Symbol('__request');
export const RequestAccessor = Symbol('__requestAccessor');
