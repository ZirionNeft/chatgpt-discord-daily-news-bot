import { BackoffWrappedException } from './backoff-wrapped.exception';

export function UseBackoff(tries = 3, ignoredErrorNames: string[] = []) {
  return function actualDecorator(
    originalMethod: (...args: any[]) => Promise<any>,
    _context: ClassMethodDecoratorContext,
  ) {
    async function replacementMethod(this: any, ...args: any[]) {
      let triesCounter = 0;

      const f = async () => {
        try {
          triesCounter++;
          return await originalMethod.call(this, ...args);
        } catch (e) {
          if (
            ignoredErrorNames.some((ignoredError) => e.name === ignoredError)
          ) {
            throw e;
          }

          if (triesCounter <= tries) {
            return f();
          }
          throw new BackoffWrappedException(tries, e);
        }
      };
      return f().finally(() => (triesCounter = 0));
    }

    return replacementMethod;
  };
}
