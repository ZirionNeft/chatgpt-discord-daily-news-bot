import { SharedNameAndDescription } from '@discordjs/builders';
import { ComponentBuilder } from 'discord.js';
import { ICommand } from './command.interfaces';
import { FailedCommandException } from './exceptions';

export abstract class BaseCommand<
  Builder extends ComponentBuilder | SharedNameAndDescription =
    | ComponentBuilder
    | SharedNameAndDescription,
  Arguments extends any[] = any[],
> implements ICommand<Builder, Arguments>
{
  public abstract readonly actionId: string;

  private _actionBuilder: Builder;

  get actionBuilder() {
    if (!this._actionBuilder) {
      this._actionBuilder = this.componentBuilderFactory();
    }
    return this._actionBuilder;
  }

  async run(..._args: any[]) {
    throw new FailedCommandException('Command is not implemented');
  }

  protected abstract componentBuilderFactory(): Builder;
}
