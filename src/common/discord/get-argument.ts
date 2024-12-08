import type { CommandInteraction } from 'discord.js';


export function getArgument<Type extends string | number | boolean>(
  interaction: CommandInteraction,
  name: string,
): Type {
  return interaction.options.get(name)?.value as Type;
}
