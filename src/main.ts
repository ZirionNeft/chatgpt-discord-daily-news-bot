import config from '#common/config.js';
import DiscordBotClient from '#common/discord/discord-bot.client.js';
import timeService from '#common/time.js';
import container from '#modules/container.js';


const locale = config.get('DAYJS_LOCALE', 'en');
await timeService.setLocale(locale);

const botClient = container.getOrFail(DiscordBotClient);

await botClient.start();
