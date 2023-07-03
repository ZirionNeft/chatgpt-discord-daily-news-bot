export class InternalErrorException extends Error {
  constructor(message?: string) {
    super(message ?? 'Internal error exception');
  }
}
