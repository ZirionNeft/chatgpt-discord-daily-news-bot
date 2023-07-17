import { Interaction } from 'discord.js';
import { InternalErrorException } from '../../common';
import { ActionIdFactory, RequestWrapper } from '../../framework';

const factory: ActionIdFactory<Interaction> = (
  request: RequestWrapper<Interaction>,
) => {
  let actionId: string;

  if (request.isCommand()) {
    actionId = request.commandName;
  } else if (request.isMessageComponent()) {
    actionId = request.customId;
  } else {
    throw new InternalErrorException('Unresolvable action inside interactor');
  }

  return actionId;
};

export default factory;
