import * as crypto from 'crypto';
import { RequestProvider } from '../interactor';
import { DIController, InjectScope, Provider } from '../ioc';
import { RequestMetadata } from './constants';
import { IRequestMetadata, RequestAttributes } from './interfaces';
import { ActionIdFactory, RequestSelector, WrappedRequest } from './types';

export class Request {
  static isRequest(target: any) {
    return (
      target &&
      typeof target === 'object' &&
      Reflect.has(target, RequestMetadata)
    );
  }

  static getMetadata(target: any): IRequestMetadata | null {
    if (this.isRequest(target)) {
      return Reflect.get(target, RequestMetadata);
    }
    return null;
  }

  static getSelector(target: any): RequestSelector | null {
    if (this.isRequest(target)) {
      const { provider, actionId } = Reflect.get(
        target,
        RequestMetadata,
      ) as IRequestMetadata;
      return `${provider}:${actionId}`;
    }
    return null;
  }

  static wrap<
    T extends object = object,
    R extends WrappedRequest<T> = WrappedRequest<T>,
  >(
    request: T,
    provider: ValueOf<typeof RequestProvider>,
    actionIdFactory: ActionIdFactory<T>,
  ): R {
    // Wrapping over original request instance for discriminate this from other provider tokens in IoC
    const requestToken = this.#produceRequestToken(
      request,
      provider,
      actionIdFactory,
    );

    return DIController.getInstanceOf(requestToken);
  }

  static #produceRequestToken<
    T extends object = object,
    R extends WrappedRequest<T> = WrappedRequest<T>,
  >(
    request: T,
    provider: ValueOf<typeof RequestProvider>,
    actionIdFactory: ActionIdFactory<T>,
  ): Type<R> {
    request[RequestMetadata] = {
      id: crypto.randomUUID(),
      actionId: actionIdFactory(request),
      provider,
    } satisfies IRequestMetadata;

    @Provider({ scope: InjectScope.REQUEST })
    class WrappedRequest implements RequestAttributes {
      declare readonly [RequestMetadata]: IRequestMetadata;

      constructor() {
        return request as RequestAttributes;
      }
    }

    return WrappedRequest as Type;
  }
}
