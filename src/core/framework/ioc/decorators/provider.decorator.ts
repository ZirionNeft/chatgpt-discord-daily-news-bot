import { DIController } from '../di.controller';

export function Provider(token?: ProviderToken) {
  return function decorator(target: Type, _context: ClassDecoratorContext) {
    const resolvedToken = token ?? target;
    DIController.register(resolvedToken, target);
  };
}
