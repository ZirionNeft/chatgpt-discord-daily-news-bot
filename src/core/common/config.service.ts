import { config } from 'dotenv';
import { Provider } from '../framework';

@Provider()
export class ConfigService {
  private readonly _config: Record<string, any> = {};

  constructor() {
    const parsed = config().parsed;

    Object.assign(this._config, parsed);
  }

  get<V = any>(key: string, defaultValue?: any): V {
    return this._config[key] ?? defaultValue;
  }
}
