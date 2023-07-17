import {
  ConfigService,
  DIController,
  Logger,
  LogLevel,
  PinoLogger,
  TimeService,
} from './core';
import { MystAIBot } from './modules';

async function bootstrap() {
  Logger.use({
    factory: () => PinoLogger,
    logLevel: LogLevel.INFO,
  });

  Logger.info(`PID: ${process.pid}`);

  const configService = DIController.getInstanceOf(null, ConfigService);
  const locale = configService.get('DAYJS_LOCALE', 'en');
  await TimeService.setLocale(locale);

  const botClient = DIController.getInstanceOf(null, MystAIBot);

  await botClient.login();
}

bootstrap();
