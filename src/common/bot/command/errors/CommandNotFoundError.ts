export class CommandNotFoundError extends Error {
  constructor(selector: string) {
    super(`Command of selector '${selector}' is not found.`);
  }
}
