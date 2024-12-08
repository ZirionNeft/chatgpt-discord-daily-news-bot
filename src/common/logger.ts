import config from '#common/config.js';
import { pino } from 'pino';

const logger = pino({
  level: config.get('LOG_LEVEL'),
  ...(config.get('LOG_PRETTY')
    ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }
    : {}),
});

export default logger;
