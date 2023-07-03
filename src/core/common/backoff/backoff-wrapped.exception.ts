export class BackoffWrappedException extends Error {
  constructor(tries: number, cause: Error) {
    super(
      `After ${tries} tries actions have been end with error: ${cause.message}`,
    );

    this.cause = cause;
  }
}
