import { BaseInteractor } from '../interactor.abstract';
import { InteractorsManager } from '../interactors.manager';

export function Interactor(token?: ProviderToken) {
  return function decorator(
    target: Type<BaseInteractor>,
    _context: ClassDecoratorContext,
  ) {
    const resolvedToken = token ?? target;

    InteractorsManager.tokensList.add(resolvedToken);
  };
}
