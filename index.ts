import { Bot } from './src/core/Bot';

(async () => {
    const bot = new Bot();
    await bot.initialize();
    await bot.start();
})();
