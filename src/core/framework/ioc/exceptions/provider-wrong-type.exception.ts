export class ProviderWrongTypeException extends Error {
  constructor(provider: Type) {
    super(`Provider ${provider.constructor.name} should be ES6 class.`);
  }
}
