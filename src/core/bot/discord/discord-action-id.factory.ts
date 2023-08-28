import { Interaction } from 'discord.js';
import { ActionIdFactory, WrappedRequest } from '../../framework';

const factory: ActionIdFactory<Interaction> = (
  request: WrappedRequest<Interaction>,
) => {
  let actionId: string;

  if (request.isCommand()) {
    actionId = request.commandName;
  } else if (request.isMessageComponent()) {
    actionId = request.customId;
  } else {
    throw new Error('Unresolvable action inside interactor');
  }

  return actionId;
};

export default factory;
