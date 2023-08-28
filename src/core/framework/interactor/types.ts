import { ProviderOptions } from '../ioc';
import { RequestProvider } from './constants';

export type InteractorOptions = Omit<ProviderOptions, 'scope'> & {
  requestProvider: ValueOf<typeof RequestProvider>;
  actionId: string;
};
