import type { SharedNameAndDescription } from '@discordjs/builders';
import type { Type } from '@zirion/ioc';
import type { ComponentBuilder } from 'discord.js';

export type CommandScope = 'all' | 'DM' | 'text' | 'thread' | 'voice';

export interface CommandOptions<
  Builder extends ComponentBuilder | SharedNameAndDescription =
      | ComponentBuilder
    | SharedNameAndDescription,
> {
  actionId: string;
  builder: (actionId: string) => Builder;
  scopes?: CommandScope[];
}

export type CommandStorageOptions = CommandOptions & {
  token: Type<ICommand>;
}

export interface ICommand<Arguments extends [...any[]] = any> {
  run(...args: Arguments): Promise<void>;
}
