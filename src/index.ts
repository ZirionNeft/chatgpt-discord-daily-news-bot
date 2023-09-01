import { ConfigService, DIController, Logger, TimeService } from './core';
import { MystAIBot } from './modules';

async function bootstrap() {
  Logger.info(`PID: ${process.pid}`);

  const configService = DIController.getInstanceOf(ConfigService);
  const locale = configService.get('DAYJS_LOCALE', 'en');
  await TimeService.setLocale(locale);

  const botClient = DIController.getInstanceOf(MystAIBot);

  await botClient.login();
}

bootstrap();
