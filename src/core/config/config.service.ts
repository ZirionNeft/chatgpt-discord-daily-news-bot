import { config } from 'dotenv';
import * as process from 'process';
import { InternalErrorException } from '../common';
import { Provider } from '../framework';

@Provider()
export class ConfigService {
  private readonly _config: Record<string, any> = {};

  constructor() {
    const parsed = config().parsed;

    Object.assign(this._config, process.env);
    Object.assign(this._config, parsed);
  }

  get<V = any>(key: string, defaultValue?: any): V {
    return this._config[key] ?? defaultValue;
  }

  getOrThrow<V = any>(key: string): V {
    const value = this._config[key];

    if (typeof value === 'undefined') {
      throw new InternalErrorException(
        `Environment variable '${key}' is undefined`,
      );
    }

    return value;
  }
}
