export type CommandScope = 'all' | 'DM' | 'text' | 'thread' | 'voice';

export interface CommandOptions {
  concurrent?: number | boolean;
  scopes?: CommandScope[];
}

export type Selector = [handlerName: string, actionId: string];
