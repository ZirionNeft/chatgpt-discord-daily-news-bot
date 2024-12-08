import type { Interaction } from 'discord.js';

const discordActionIdFactory = (
  request: Interaction,
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

export default discordActionIdFactory;
