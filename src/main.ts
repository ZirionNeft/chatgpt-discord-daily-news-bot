import { config } from 'dotenv';
import { initBotClient } from './bot/client.js';

config();

async function bootstrap() {
  await initBotClient();
}

bootstrap();
