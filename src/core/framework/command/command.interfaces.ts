import { SharedNameAndDescription } from '@discordjs/builders';
import { ComponentBuilder } from 'discord.js';

export interface ICommand<
  Builder extends ComponentBuilder | SharedNameAndDescription,
  Arguments extends [...any[]] = any,
> {
  get actionBuilder(): Builder;

  run(...args: Arguments): Promise<void>;
}

export interface IRegistrableCommand<
  Builder extends ComponentBuilder | SharedNameAndDescription,
  Arguments extends [...any[]] = any,
> extends ICommand<Builder, Arguments> {
  register(): Promise<void>;
}
