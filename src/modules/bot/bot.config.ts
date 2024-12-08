import { DailyNewsSlashCommandName } from '#modules/bot/daily-news/constants.js';

export default {
  commands: {
    [DailyNewsSlashCommandName]: {
      header: `Daily News for **{1}** in channel {2}:\n\n`,
    },
  },
} as const;
