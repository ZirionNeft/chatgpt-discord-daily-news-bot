export interface ICommand<Arguments extends [...any[]] = any> {
  get actionId(): string;

  run(...args: Arguments): Promise<void>;
}
