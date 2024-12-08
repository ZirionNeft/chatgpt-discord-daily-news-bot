import { FailedCommandError } from '#common/bot/command/errors/FailedCommandError.js';
import type { Dayjs } from 'dayjs';

export class InvalidDateFormatError extends FailedCommandError {
  constructor(value: string | Dayjs, format: string) {
    super(`Invalid format of date '${value}'. Please use '${format}'.`);
  }
}

