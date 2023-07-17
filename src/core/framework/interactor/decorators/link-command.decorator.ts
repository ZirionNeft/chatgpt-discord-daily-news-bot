import { BaseCommand, CommandOptions } from '../../command';
import { BaseInteractor } from '../base-interactor.abstract';

const defaultOptions: CommandOptions = {
  concurrent: true,
  scopes: ['all'],
};

export function LinkCommand(
  methodName: string,
  options: CommandOptions = { ...defaultOptions },
) {
  return function <This extends BaseInteractor>(
    _target: undefined,
    _context: ClassFieldDecoratorContext<This>,
  ) {
    return function <Value extends BaseCommand<any> = BaseCommand<any>>(
      this: This,
      value: Value,
    ) {
      this.commandsLinkMap.set(value.actionId, {
        type: value.constructor as Type<Value>,
        handlerName: methodName,
        options: {
          ...defaultOptions,
          ...options,
        },
      });
      return value;
    };
  };
}
