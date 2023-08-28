import { SharedNameAndDescription } from '@discordjs/builders';
import { ComponentBuilder } from 'discord.js';
import { RequestProvider } from '../interactor';
import { ProviderOptions } from '../ioc';

export type CommandScope = 'all' | 'DM' | 'text' | 'thread' | 'voice';

export interface CommandOptions<
  Builder extends ComponentBuilder | SharedNameAndDescription =
    | ComponentBuilder
    | SharedNameAndDescription,
> {
  actionId: string;
  builder: (actionId: string) => Builder;
  provider?: ValueOf<typeof RequestProvider>;
  providerOptions?: ProviderOptions;
  concurrent?: number | boolean;
  scopes?: CommandScope[];
}
