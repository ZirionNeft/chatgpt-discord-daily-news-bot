import { UUID } from 'crypto';
import { RequestProvider } from '../interactor';
import { RequestMetadata } from './constants';

export interface IRequestMetadata {
  id: UUID;
  actionId: string;
  provider: ValueOf<typeof RequestProvider>;
}

export interface RequestAttributes {
  readonly [RequestMetadata]: IRequestMetadata;
}
