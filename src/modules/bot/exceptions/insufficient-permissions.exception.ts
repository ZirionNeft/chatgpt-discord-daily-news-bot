import { FailedCommandException } from '../../../core';

export class InsufficientPermissionsException extends FailedCommandException {
  constructor() {
    super('You are not permitted to see this channel');
  }
}
