export class ActionWrongTargetException extends Error {
  constructor(selector: string, token: Type) {
    super(
      `Action of selector '${selector}' is bound to another interactor class. Required token is ${token.constructor.name}.`,
    );
  }
}
