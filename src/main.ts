import { config } from 'dotenv';
import { initBotClient } from './bot/client.js';

config();

import './cron.js';

console.log('PID:', process.pid);

async function bootstrap() {
  await initBotClient();
}

bootstrap();
