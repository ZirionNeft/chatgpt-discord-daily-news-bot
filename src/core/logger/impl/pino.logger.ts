import { Level, Logger, LoggerOptions as PinoLoggerOptions, pino } from 'pino';
import { LogLevel } from '../constants';
import { ILogger, LoggerOptions } from '../interfaces';

export class PinoLogger<Options extends PinoLoggerOptions = PinoLoggerOptions>
  implements ILogger
{
  private readonly pinoInstance: Logger<Options>;

  constructor(options: Omit<LoggerOptions<Options>, 'factory'>) {
    this.pinoInstance = pino<Options>({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'UTC:HH:MM:ss.l',
        },
      },
      level: this.logLevelAdapter(options.logLevel),
      ...options.providerOptions,
    } as any);
  }

  verbose(
    msgOrObj: string | object,
    context: string | null,
    ...args: any[]
  ): void {
    if (typeof msgOrObj === 'string') {
      this.pinoInstance.debug({ msg: msgOrObj, caller: context, data: args });
    } else {
      this.pinoInstance.debug({ ...msgOrObj, caller: context, data: args });
    }
  }

  info(
    msgOrObj: string | object,
    context: string | null,
    ...args: any[]
  ): void {
    if (typeof msgOrObj === 'string') {
      this.pinoInstance.info({ msg: msgOrObj, caller: context, data: args });
    } else {
      this.pinoInstance.info({ ...msgOrObj, caller: context, data: args });
    }
  }

  warn(
    msgOrObj: string | object,
    context: string | null,
    ...args: any[]
  ): void {
    if (typeof msgOrObj === 'string') {
      this.pinoInstance.warn({ msg: msgOrObj, caller: context, data: args });
    } else {
      this.pinoInstance.warn({ ...msgOrObj, caller: context, data: args });
    }
  }

  error(
    msgOrObj: string | object,
    context: string | null,
    ...args: any[]
  ): void {
    if (typeof msgOrObj === 'string') {
      this.pinoInstance.error({ msg: msgOrObj, caller: context, data: args });
    } else {
      this.pinoInstance.error({ err: msgOrObj, caller: context, data: args });
    }
  }

  fatal(
    msgOrObj: string | object,
    context: string | null,
    ...args: any[]
  ): void {
    if (typeof msgOrObj === 'string') {
      this.pinoInstance.fatal({ msg: msgOrObj, caller: context, data: args });
    } else {
      this.pinoInstance.fatal({ err: msgOrObj, caller: context, data: args });
    }
  }

  private logLevelAdapter<LevelType extends Level = Level>(
    logLevel: ValueOf<typeof LogLevel>,
  ): LevelType {
    let level = 'info';

    switch (logLevel) {
      case LogLevel.VERBOSE:
        level = 'debug';
        break;
      case LogLevel.INFO:
        level = 'info';
        break;
      case LogLevel.WARN:
        level = 'warn';
        break;
      case LogLevel.ERROR:
        level = 'error';
        break;
      case LogLevel.FATAL:
        level = 'fatal';
        break;
    }
    return level as LevelType;
  }
}
