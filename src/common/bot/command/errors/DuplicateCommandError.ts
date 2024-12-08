export class DuplicateCommandError extends Error {
  constructor(selector: string) {
    super(`Command of selector '${selector}' is already registered.`);
  }
}
