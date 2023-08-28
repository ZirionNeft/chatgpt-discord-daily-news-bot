import { InjectScope, Provider } from '../../../core';

@Provider({ scope: InjectScope.REQUEST })
export class AbortControllerProvider implements AbortController {
  private readonly abortController = new AbortController();

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  abort(reason?: any): void {
    this.abortController.abort(reason);
  }
}
