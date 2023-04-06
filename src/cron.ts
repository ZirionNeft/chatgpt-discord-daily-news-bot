import { config } from 'dotenv';
import dayjs from 'dayjs';
import cron from 'node-cron';
import { CLIENT } from './bot/client.js';
import { sendDailyNews } from './bot/commands/daily.command.js';

config();

const GUILD_SCHEDULED_CHANNELS = process.env.CHANNELS_IDS.split(',');
const GUILD_ID = process.env.GUILD_ID;

// every day at 21:00:00 UTC
cron.schedule('0 21 * * *', () => dailyNewsSchedule(), {
  timezone: 'Etc/UTC',
});

async function dailyNewsSchedule() {
  console.log('Scheduled Daily News task is performing');

  const guild = CLIENT.guilds.cache.get(GUILD_ID);

  if (!guild) {
    console.log(`Guild with id ${GUILD_ID} is not found`);
    return;
  }

  for (const channelId of GUILD_SCHEDULED_CHANNELS) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) {
      continue;
    }

    try {
      const result = await sendDailyNews(channel, channel, dayjs.utc());

      if (!result) {
        console.log(`Message successfully sent to #${channel.name}`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
