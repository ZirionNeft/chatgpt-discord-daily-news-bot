export class RequestAbortedException extends Error {
  constructor(message?: string) {
    super(message ?? 'Request aborted');
  }
}
