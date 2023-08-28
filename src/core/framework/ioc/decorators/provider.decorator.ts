import { InjectScope } from '../constants';
import { DIController } from '../DiController';
import { ProviderOptions } from '../interfaces';

const defaultOptions: ProviderOptions = {
  scope: InjectScope.SINGLETONE,
  aliases: [],
};

export function Provider(options?: ProviderOptions) {
  return function decorate<Target extends Type>(
    target: Target,
    _context: ClassDecoratorContext,
  ) {
    if (_context.kind === 'class') {
      const resolvedOptions: ProviderOptions = {
        ...defaultOptions,
        ...(options ?? {}),
      };

      DIController.register(
        [...new Set([target, ...resolvedOptions.aliases])],
        target,
        resolvedOptions.scope,
      );

      return target;
    }

    throw new Error('Provider decorator can be applied only for class');
  };
}
