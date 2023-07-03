import { Dayjs } from 'dayjs';

export class InvalidDateFormatException extends Error {
  constructor(value: string | Dayjs, format: string) {
    super(`Invalid format of date '${value}'. Please use '${format}'.`);
  }
}
