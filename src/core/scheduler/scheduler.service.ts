import Cron from 'croner';
import { TIMEZONE } from './scheduler.constants.js';
import { SchedulerTask } from './types';

export class SchedulerService {
  private static readonly _tasks: Cron[] = [];

  static addTask({ handler, time }: SchedulerTask) {
    this.createSchedule(handler, time)
      .then(() => {
        const name = handler.constructor.name;
        console.info(`Schedule task added for '${name}'`);
      })
      .catch(console.error);
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
      () => callback().catch(console.error),
    );

    this._tasks.push(task);
  }
}
