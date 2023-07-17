import { IRegistrableCommand } from '../command.interfaces';

export function isRegistrable(target: any): target is IRegistrableCommand<any> {
  return (
    typeof target === 'object' && typeof target?.['register'] === 'function'
  );
}
