import { RequestSelector } from '../../request';

export class CommandNotFoundException extends Error {
  constructor(selector: RequestSelector) {
    super(`Command of selector '${selector}' is not found.`);
  }
}
