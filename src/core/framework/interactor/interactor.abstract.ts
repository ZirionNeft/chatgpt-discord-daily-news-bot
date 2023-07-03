import { Interaction } from 'discord.js';
import { InternalErrorException } from '../../common';
import { BaseCommand } from '../command';

export abstract class BaseInteractor {
  readonly commands = new Map<
    string,
    {
      type: Type<BaseCommand>;
      handlerName: string;
    }
  >();

  async bootstrap(interaction: Interaction) {
    const actionId = BaseInteractor.getActionId(interaction);

    if (this.commands.has(actionId)) {
      const handlerName = this.commands.get(actionId).handlerName;
      const handler = Reflect.get(this, handlerName) as (
        interaction: Interaction,
      ) => MaybePromise<any>;

      await handler.call(this, interaction);
    } else {
      throw new InternalErrorException('Action no implemented');
    }
  }

  static getActionId(interaction: Interaction) {
    let actionId: string;
    if (interaction.isCommand()) {
      actionId = interaction.commandName;
    } else if (interaction.isMessageComponent()) {
      actionId = interaction.customId;
    } else {
      throw new InternalErrorException('Unresolvable action inside interactor');
    }

    return actionId;
  }
}
