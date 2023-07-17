export interface IBotClient<BotProvider = unknown> {
  readonly provider: BotProvider;

  login(): Promise<void>;
}
