import { FailedCommandError } from '#common/bot/command/errors/FailedCommandError.js';

export class InsufficientPermissionsError extends FailedCommandError {
  constructor() {
    super('You are not permitted to see this channel');
  }
}
