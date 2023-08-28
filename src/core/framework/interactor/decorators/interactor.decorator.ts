import { DIController, InjectScope, Provider } from '../../ioc';
import { RequestSelector } from '../../request';
import { BaseInteractor } from '../base-interactor.abstract';
import { InteractorsManager } from '../providers';
import { InteractorOptions } from '../types';

export function Interactor(options: InteractorOptions) {
  return function decorator<T extends BaseInteractor = BaseInteractor>(
    target: Type<T>,
    _context: ClassDecoratorContext,
  ) {
    const providerDecorator = Provider({
      aliases: options.aliases ?? [],
      scope: InjectScope.REQUEST,
    });

    const extendedTargetToken = providerDecorator(target, _context);

    const interactorsManager = DIController.getInstanceOf(InteractorsManager);

    const requestSelector: RequestSelector = `${options.requestProvider}:${options.actionId}`;

    interactorsManager.add(requestSelector, extendedTargetToken);

    return extendedTargetToken;
  };
}
