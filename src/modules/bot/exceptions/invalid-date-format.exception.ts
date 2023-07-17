import { Dayjs } from 'dayjs';
import { FailedCommandException } from '../../../core';

export class InvalidDateFormatException extends FailedCommandException {
  constructor(value: string | Dayjs, format: string) {
    super(`Invalid format of date '${value}'. Please use '${format}'.`);
  }
}
