import logger from '#common/logger.js';
import type { MaybePromise } from '#common/types.js';
import { Cron } from 'croner';
import type { SchedulerTask } from './types.js';

export const TIMEZONE = 'Etc/UTC';


export class SchedulerService {
  readonly #tasks: Cron[] = [];

  addTask({ handler, time }: SchedulerTask) {
    this.#createSchedule(handler, time)
      .then(() => {
        logger.info(
          `Schedule task added for '${handler.name}'`,
        );
      })
      .catch((e) => logger.error(e));
  }

  async #createSchedule(
    callback: () => MaybePromise<void>,
    pattern: string | Date,
  ) {
    const task = new Cron(
      pattern,
      {
        timezone: TIMEZONE,
      },
      async () => {
        try {
          await callback();
        } catch (e) {
          logger.error(e);
        }
      },
    );

    this.#tasks.push(task);
  }
}

const schedulerService = new SchedulerService();

export default schedulerService;
