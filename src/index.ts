import { ConfigService, DIController, TimeService } from './core';
import { BotClient } from './modules';

console.log('PID:', process.pid);

async function bootstrap() {
  DIController.runFactory();

  const configService = DIController.getInstanceOf(ConfigService);
  const locale = configService.get('DAYJS_LOCALE', 'en');
  await TimeService.setLocale(locale);

  const botClient = DIController.getInstanceOf(BotClient);

  await botClient.init();
}

bootstrap();
