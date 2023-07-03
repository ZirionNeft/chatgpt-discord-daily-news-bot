import { BaseCommand } from '../../command';
import { BaseInteractor } from '../interactor.abstract';

export function LinkCommand(methodName: string) {
  return function <This extends BaseInteractor>(
    _target: undefined,
    _context: ClassFieldDecoratorContext<This>,
  ) {
    return function <Value extends BaseCommand<any> = BaseCommand<any>>(
      this: This,
      value: Value,
    ) {
      this.commands.set(value.actionId, {
        type: value.constructor as Type<Value>,
        handlerName: methodName,
      });
      return value;
    };
  };
}
