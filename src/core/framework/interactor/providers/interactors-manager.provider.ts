import { DIController, Inject, Provider, ProviderToken } from '../../ioc';
import {
  Request,
  RequestQueue,
  RequestSelector,
  WrappedRequest,
} from '../../request';
import { BaseInteractor } from '../base-interactor.abstract';
import { ActionNotFoundException } from '../exceptions';
import { ActionWrongTargetException } from '../exceptions/action-wrong-target.exception';

@Provider()
export class InteractorsManager {
  @Inject(RequestQueue)
  private readonly requestQueue: RequestQueue;

  private readonly actionIdToInteractor: Map<
    RequestSelector,
    Type<BaseInteractor>
  > = new Map();

  add<T extends BaseInteractor>(
    selector: RequestSelector,
    interactorToken: Type<T>,
  ) {
    this.actionIdToInteractor.set(selector, interactorToken);
  }

  getOrThrow(selector: RequestSelector) {
    const interactorToken = this.actionIdToInteractor.get(selector);

    if (!interactorToken) {
      throw new ActionNotFoundException(selector);
    }

    if (!(this instanceof interactorToken)) {
      throw new ActionWrongTargetException(selector, interactorToken);
    }

    return interactorToken;
  }

  async resolve(request: WrappedRequest) {
    const selector = Request.getSelector(request);

    if (!selector || !this.actionIdToInteractor.has(selector)) {
      throw new ActionNotFoundException(selector);
    }

    const targetInteractorToken = this.actionIdToInteractor.get(selector);

    this.requestQueue.push(request, async (request) => {
      const interactor = DIController.getInstanceOf<
        ProviderToken,
        BaseInteractor
      >(targetInteractorToken);

      await interactor.bootstrap(request);
    });
  }
}
