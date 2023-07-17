import { InternalErrorException } from '../../common';
import { Logger } from '../../logger';
import { IRegistrableCommand, isRegistrable } from '../command';
import { DIController, Provider, ProviderToken } from '../ioc';
import { RequestWrapper } from '../request';
import { BaseInteractor } from './base-interactor.abstract';

@Provider()
export class InteractorsManager {
  private readonly logger = new Logger(this.constructor.name);

  static readonly tokensList = new Set<ProviderToken>();

  private readonly _actionToInteractor: Map<string, ProviderToken> = new Map();

  resolve(request: RequestWrapper) {
    const actionId = request.actionId;

    if (!this._actionToInteractor.has(actionId)) {
      throw new InternalErrorException('Unresolvable action');
    }

    const targetInteractorToken = this._actionToInteractor.get(actionId);

    return DIController.getInstanceOf<ProviderToken, BaseInteractor>(
      this,
      targetInteractorToken,
    );
  }

  async registerCommands() {
    const registeredActionsIds: string[] = [];

    for (const token of InteractorsManager.tokensList) {
      const interactor = DIController.getInstanceOf<
        ProviderToken,
        BaseInteractor
      >(this, token);

      for (const [
        actionId,
        { type: commandToken },
      ] of interactor.commandsLinkMap) {
        if (this._actionToInteractor.has(actionId)) {
          throw new InternalErrorException(
            `Conflict during registering commands - ActionId '${actionId}' is already registered`,
          );
        }

        const commandInstance = DIController.getInstanceOf<
          ProviderToken,
          IRegistrableCommand<any>
        >(this, commandToken);

        if (isRegistrable(commandInstance)) {
          await commandInstance.register();
          this.logger.info(`Command [${commandToken.name}] registered`);
        }

        this._actionToInteractor.set(actionId, token);
      }

      registeredActionsIds.push(...interactor.commandsLinkMap.keys());
    }

    return registeredActionsIds;
  }
}
