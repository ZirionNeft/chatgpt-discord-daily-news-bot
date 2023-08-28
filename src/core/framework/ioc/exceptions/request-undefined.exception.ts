export class RequestUndefinedException extends Error {
  constructor() {
    super('Request instance is undefined.');
  }
}
