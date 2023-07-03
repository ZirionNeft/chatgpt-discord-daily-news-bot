import { DailyNewsSlashCommandName } from './daily-news/daily-news.constants';

export default {
  commands: {
    [DailyNewsSlashCommandName]: {
      header: `Daily News for **{1}** in channel {2}:\n\n`,
    },
  },
} as const;
