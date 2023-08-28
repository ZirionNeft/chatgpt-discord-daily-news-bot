export class ActionNotFoundException extends Error {
  constructor(selector: string) {
    super(`Unresolvable action of selector '${selector}'`);
  }
}
