import { FailedCommandException } from './failed-command.exception';

export class ConcurrentRunException extends FailedCommandException {
  constructor() {
    super(
      `Command is currently reach of max concurrent runs. Please, take a pause and try again soon.`,
    );
  }
}
