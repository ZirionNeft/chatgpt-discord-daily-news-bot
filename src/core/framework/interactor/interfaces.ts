import { BaseCommand } from '../command';
import { CommandOptions } from '../command/types';

export interface LinkedCommandData {
  type: Type<BaseCommand>;
  handlerName: string;
  options?: CommandOptions;
}
