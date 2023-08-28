export class DuplicateProviderException extends Error {
  constructor(provider: Type) {
    super(`Duplicate provider: ${provider.constructor.name}`);
  }
}
