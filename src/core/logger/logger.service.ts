import { LogLevel } from './constants';
import { ConsoleLogger } from './impl';
import { ILogger, LoggerOptions } from './interfaces';

export class Logger implements ILogger {
  private readonly context: string | null = null;

  constructor(context: string | Type) {
    this.context =
      typeof context === 'string' ? context : context.constructor.name;
  }

  private static provider: ILogger;

  static use<ProviderOptions>(
    options: LoggerOptions<ProviderOptions> = {
      factory: () => ConsoleLogger,
      providerOptions: {} as ProviderOptions,
      logLevel: LogLevel.INFO,
    },
  ) {
    const Type = options.factory();
    Logger.provider = new Type({
      providerOptions: options.providerOptions,
      logLevel: options.logLevel,
    });
  }

  verbose(msgOrObj: string | object, ...args: any[]): void {
    Logger.provider.verbose(msgOrObj, this.context, ...args);
  }

  info(msgOrObj: string | object, ...args: any[]): void {
    Logger.provider.info(msgOrObj, this.context, ...args);
  }

  warn(msgOrObj: string | object, ...args: any[]): void {
    Logger.provider.warn(msgOrObj, this.context, ...args);
  }

  error(msgOrObj: string | object, ...args: any[]): void {
    Logger.provider.error(msgOrObj, this.context, ...args);
  }

  fatal(msgOrObj: string | object, ...args: any[]): void {
    Logger.provider.fatal(msgOrObj, this.context, ...args);
  }

  static verbose(
    msgOrObj: string | object,
    context: string | null = null,
    ...args: any[]
  ): void {
    Logger.provider.verbose(msgOrObj, context, ...args);
  }

  static info(
    msgOrObj: string | object,
    context: string | null = null,
    ...args: any[]
  ): void {
    Logger.provider.info(msgOrObj, context, ...args);
  }

  static warn(
    msgOrObj: string | object,
    context: string | null = null,
    ...args: any[]
  ): void {
    Logger.provider.warn(msgOrObj, context, ...args);
  }

  static error(
    msgOrObj: string | object,
    context: string | null = null,
    ...args: any[]
  ): void {
    Logger.provider.error(msgOrObj, context, ...args);
  }

  static fatal(
    msgOrObj: string | object,
    context: string | null = null,
    ...args: any[]
  ): void {
    Logger.provider.fatal(msgOrObj, context, ...args);
  }

  static log(
    level: ValueOf<typeof LogLevel>,
    msgOrObj: string | object,
    context: string | null = null,
    ...args: any[]
  ) {
    const key = Object.keys(LogLevel)[level];
    Logger.provider[key.toLowerCase()](msgOrObj, context, ...args);
  }
}
