import { ProviderToken } from '../types';

export class ProviderNotFoundException extends Error {
  constructor(token: ProviderToken) {
    super(`Provider is not found: ${token.toString()}`);
  }
}
