import { InjectScope } from './constants';
import { ProviderToken } from './types';

export interface ProviderOptions {
  scope?: ValueOf<typeof InjectScope>;
  aliases?: ProviderToken[];
}
