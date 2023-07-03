import { IRegistrableCommand } from '../command.interfaces';

export function isRegistrable(target: any): target is IRegistrableCommand<any> {
  return 'register' in target && typeof target['register'] === 'function';
}
