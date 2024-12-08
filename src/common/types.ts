export type MaybePromise<T> = T | Promise<T>;

export type ValueOf<T> = T[keyof T];

export type AsMapped<T> = { [K in keyof T]: T[K] };
