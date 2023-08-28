import { SharedNameAndDescription } from '@discordjs/builders';
import { ComponentBuilder } from 'discord.js';
import { DIController, Provider } from '../../ioc';
import { ICommand } from '../interfaces';
import { CommandsStorage } from '../providers';
import { CommandOptions } from '../types';

const defaultOptions: Partial<CommandOptions> = {
  concurrent: true,
  scopes: ['all'],
};

export function Command<
  Builder extends ComponentBuilder | SharedNameAndDescription =
    | ComponentBuilder
    | SharedNameAndDescription,
>(options: CommandOptions<Builder>) {
  const ProviderDecorator = Provider({
    ...(options.providerOptions ?? {}),
  });
  return function decorate<This extends ICommand>(
    commandTarget: Type<This>,
    _context: ClassDecoratorContext,
  ) {
    const commandProvider = ProviderDecorator(commandTarget, _context);

    const commandStorage = DIController.getInstanceOf(CommandsStorage);

    commandStorage.add({
      ...defaultOptions,
      ...options,
      token: commandProvider,
    });

    return commandProvider;
  };
}
