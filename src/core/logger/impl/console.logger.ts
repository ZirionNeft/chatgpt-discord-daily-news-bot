import { LogLevel } from '../constants';
import { ILogger, LoggerOptions } from '../interfaces';

export class ConsoleLogger implements ILogger {
  constructor(private readonly option: Pick<LoggerOptions, 'logLevel'>) {}

  verbose(...args: any[]): void {
    if (this.option.logLevel >= LogLevel.VERBOSE) {
      console.debug(...args);
    }
  }

  info(...args: any[]): void {
    if (this.option.logLevel >= LogLevel.INFO) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.option.logLevel >= LogLevel.WARN) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (this.option.logLevel >= LogLevel.ERROR) {
      console.error(...args);
    }
  }

  fatal(...args: any[]): void {
    if (this.option.logLevel >= LogLevel.FATAL) {
      console.error(...args);
    }
  }
}
