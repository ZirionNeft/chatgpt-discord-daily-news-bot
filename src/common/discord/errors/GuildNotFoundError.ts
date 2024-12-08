export class GuildNotFoundError extends Error {
  constructor(guildId: string) {
    super(`Guild with id '${guildId}' is not found`);
  }
}
