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

  const configService = DIController.getInstanceOf(ConfigService);
  const locale = configService.get('DAYJS_LOCALE', 'en');
  await TimeService.setLocale(locale);

  const botClient = DIController.getInstanceOf(MystAIBot);

  await botClient.login();
}

bootstrap();
