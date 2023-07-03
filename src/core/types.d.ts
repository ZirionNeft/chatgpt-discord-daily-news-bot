declare type Type<T = any> = { new (...args: any[]): T };

declare type MaybePromise<T> = T | Promise<T>;
