import logger from '#common/logger.js';
import type { MaybePromise } from '#common/types.js';
import { delay } from './utils/delay.js';

const backoffRetryFactory = (options: {
  retryCount: number;
  retryOnNullish?: boolean;
  strategy?: (currentTry: number) => number; // ms
}) => {
  const strategy = options.strategy || ((currentTry) => 1000 * currentTry);

  const backoffRetry = async <T>(
    fn: () => MaybePromise<T>,
    retryCount: number = options.retryCount,
  ): Promise<T> => {
    const makeNewTry = async (e: unknown | null) => {
      if (retryCount) {
        logger.debug(
          { message: (e as Error)?.message },
          `Retrying ${fn.name} with ${retryCount} retries left`,
        );

        const delayMs = strategy(options.retryCount - retryCount + 1);
        await delay(delayMs);

        retryCount--;
        return backoffRetry<T>(fn, retryCount);
      } else {
        logger.error(
          e,
          `Failed to execute ${fn.name} after ${options.retryCount} retries`,
        );

        if (e) {
          throw e;
        } else {
          return null as T;
        }
      }
    };

    try {
      const res = (await fn()) as T;

      if (!res && options.retryOnNullish) {
        return makeNewTry(res);
      }

      return res;
    } catch (e: any) {
      return makeNewTry(e);
    }
  };

  return backoffRetry;
};

export default backoffRetryFactory;
