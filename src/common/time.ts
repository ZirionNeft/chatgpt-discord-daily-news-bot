import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import utc from 'dayjs/plugin/utc.js';

export class TimeService {
  static {
    dayjs.extend(customParseFormat);
    dayjs.extend(isBetween);
    dayjs.extend(localizedFormat);
    dayjs.extend(utc);
  }

  async setLocale(value: string) {
    const localeData = await import(`dayjs/locale/${value}.js`);
    dayjs.locale(localeData.default);
  }

  resolveFormat(date: string | Dayjs, format: string): Dayjs {
    const parsedDate = dayjs.utc(date, format);

    return parsedDate;
  }

  timestamp() {
    return dayjs.utc();
  }
}

const timeService = new TimeService();

export default timeService;
