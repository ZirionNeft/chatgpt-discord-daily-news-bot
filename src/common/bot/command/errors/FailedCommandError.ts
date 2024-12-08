export class FailedCommandError extends Error {
  constructor(message?: string) {
    super(`\`${message ?? 'Command run has failed'}\``);
  }
}
