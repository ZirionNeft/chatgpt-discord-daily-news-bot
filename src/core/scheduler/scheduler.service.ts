import Cron from 'croner';
import { Logger } from '../logger';
import { TIMEZONE } from './scheduler.constants.js';
import { SchedulerTask } from './types';

export class SchedulerService {
  private static readonly logger = new Logger(SchedulerService);

  private static readonly _tasks: Cron[] = [];

  static addTask({ handler, time }: SchedulerTask) {
    this.createSchedule(handler, time)
      .then(() => {
        SchedulerService.logger.info(
          `Schedule task added for '${handler.name}'`,
        );
      })
      .catch((e) => SchedulerService.logger.error(e));
  }

  private static async createSchedule(
    callback: () => Promise<void>,
    pattern: string | Date,
  ) {
    const task = Cron(
      pattern,
      {
        timezone: TIMEZONE,
      },
      () => callback().catch((e) => SchedulerService.logger.error(e)),
    );

    this._tasks.push(task);
  }
}
