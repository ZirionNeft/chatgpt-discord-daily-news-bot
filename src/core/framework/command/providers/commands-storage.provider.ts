import { RequestProvider } from '../../interactor';
import { Provider } from '../../ioc';
import { RequestSelector } from '../../request';
import { DuplicateCommandException } from '../exceptions';
import { ICommand } from '../interfaces';
import { CommandOptions } from '../types';

type CommandData = CommandOptions & {
  token: Type<ICommand>;
};

@Provider()
export class CommandsStorage {
  private readonly commandsMetadata = new Map<RequestSelector, CommandData>();

  add(command: CommandData) {
    const selector = `${command.provider ?? RequestProvider.GLOBAL}:${
      command.actionId
    }` as RequestSelector;

    if (this.commandsMetadata.has(selector)) {
      throw new DuplicateCommandException(command.actionId);
    }
    this.commandsMetadata.set(selector, command);
  }

  get(selector: RequestSelector) {
    return this.commandsMetadata.get(selector);
  }

  getIterator() {
    return this.commandsMetadata.entries();
  }
}
