type Type<T = any> = { new (...args: any[]): T };

type MaybePromise<T> = T | Promise<T>;

type ValueOf<T> = T[keyof T];

type AsMapped<T> = { [K in keyof T]: T[K] };
