import { DIController } from '../di.controller';

export function Inject<TokenType extends ProviderToken = ProviderToken>(
  token: TokenType,
) {
  return function <
    This,
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
        console.warn(
          `Provider of target '${
            this.constructor.name
          }.${_context.name.toString()}' already have value and not have been injected`,
        );
        return value;
      }
      return DIController.getInstanceOf(token);
    };
  };
}
