import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import { InvalidDateFormatException } from './exceptions';

export class TimeService {
  static {
    dayjs.extend(customParseFormat);
    dayjs.extend(isBetween);
    dayjs.extend(localizedFormat);
    dayjs.extend(utc);
  }

  static async setLocale(value: string) {
    const localeData = await import(`dayjs/locale/${value}.js`);
    dayjs.locale(localeData.default);
  }

  static resolveFormat(date: string | Dayjs, format: string): Dayjs {
    const parsedDate = dayjs.utc(date, format);

    if (!parsedDate.isValid()) {
      throw new InvalidDateFormatException(date, format);
    }

    return parsedDate;
  }

  static timestamp() {
    return dayjs.utc();
  }
}
