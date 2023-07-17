import { Logger } from '../../../logger';
import { DIController } from '../di.controller';
import { ProviderInstance, ProviderToken } from '../types';

export function Inject<TokenType extends ProviderToken = ProviderToken>(
  token: TokenType,
) {
  return function <
    This extends ProviderInstance,
    ActualValue = TokenType extends new (...args) => any
      ? InstanceType<TokenType>
      : any,
  >(
    _target: undefined,
    _context: ClassFieldDecoratorContext<This, ActualValue>,
  ) {
    return function <GotValue extends ActualValue>(
      this: This,
      value: GotValue,
    ) {
      if (value) {
        Logger.warn(
          `Provider of target '${
            this.constructor.name
          }.${_context.name.toString()}' already have value and not have been injected`,
          'Inject',
        );
        return value;
      }

      return DIController.getInstanceOf(this, token);
    };
  };
}
