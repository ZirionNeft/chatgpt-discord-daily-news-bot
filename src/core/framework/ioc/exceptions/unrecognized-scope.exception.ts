export class UnrecognizedScopeException extends Error {
  constructor(scope: string, provider: Type) {
    super(
      `Unrecognized scope ${scope} of provider ${provider.constructor.name}`,
    );
  }
}
