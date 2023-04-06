import { config } from 'dotenv';
import { initBotClient } from './bot/client.js';

config();

import './cron.js';

async function bootstrap() {
  await initBotClient();
}

bootstrap();
