import { LogLevel } from './constants';

export interface LoggerOptions<ProviderOptions = any> {
  factory?: () => Type<ILogger>;
  providerOptions?: ProviderOptions;
  logLevel?: ValueOf<typeof LogLevel>;
}

export interface ILogger {
  verbose(msgOrObj: string | object, ...args: any[]): void;
  info(msgOrObj: string | object, ...args: any[]): void;
  warn(msgOrObj: string | object, ...args: any[]): void;
  error(msgOrObj: string | object, ...args: any[]): void;
  fatal(msgOrObj: string | object, ...args: any[]): void;
}
