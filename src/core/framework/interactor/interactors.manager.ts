import { Interaction } from 'discord.js';
import { InternalErrorException } from '../../common';
import { IRegistrableCommand, isRegistrable } from '../command';
import { DIController, Provider } from '../ioc';
import { BaseInteractor } from './interactor.abstract';

@Provider()
export class InteractorsManager {
  static readonly tokensList = new Set<ProviderToken>();

  private readonly _actionToInteractor: Map<string, ProviderToken> = new Map();

  resolve(interaction: Interaction) {
    const actionId = BaseInteractor.getActionId(interaction);

    if (!this._actionToInteractor.has(actionId)) {
      throw new InternalErrorException('Unresolvable action');
    }

    const targetInteractorToken = this._actionToInteractor.get(actionId);

    return DIController.getInstanceOf<ProviderToken, BaseInteractor>(
      targetInteractorToken,
    );
  }

  async registerCommands() {
    const registeredActionsIds: string[] = [];

    for (const token of InteractorsManager.tokensList) {
      const interactor = DIController.getInstanceOf<
        ProviderToken,
        BaseInteractor
      >(token);

      for (const [actionId, { type: commandToken }] of interactor.commands) {
        const commandInstance = DIController.getInstanceOf<
          ProviderToken,
          IRegistrableCommand<any>
        >(commandToken);

        if (isRegistrable(commandInstance)) {
          await commandInstance.register();
          console.info(
            `Command '${commandToken.name}' is a slash command and have been registered`,
          );
        }

        if (this._actionToInteractor.has(actionId)) {
          throw new InternalErrorException(
            `Conflict during registering commands - ActionId '${actionId}' is already registered`,
          );
        }

        this._actionToInteractor.set(actionId, token);
      }

      registeredActionsIds.push(...interactor.commands.keys());
    }

    return registeredActionsIds;
  }
}
