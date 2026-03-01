import { formatNumber, getCooldown, formatTime, getRandom, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const BEG_SUCCESS = [
    { text: 'Un desconocido te dio', emoji: '👥', multi: 1 },
    { text: 'Encontraste tirado', emoji: '🍀', multi: 1.2 },
    { text: 'Tu abuela te regaló', emoji: '👵', multi: 2 },
    { text: 'Vendiste limonada y ganaste', emoji: '🍋', multi: 1.5 },
    { text: 'Ayudaste a cruzar la calle a una anciana y te dio', emoji: '👵', multi: 1.5 },
    { text: 'Hiciste malabares en el semáforo y te dieron', emoji: '🤹', multi: 1.3 }
];
const BEG_FAIL = [
    'Nadie te dio nada',
    'Te miraron feo y no te dieron nada',
    'Intentaste pedir pero te ignoraron',
    'La policía te dijo que te fueras',
    'Un perro te ladró y saliste corriendo',
    'Se te cayó el vaso de las monedas'
];

const command: Command = {
    commands: ['beg', 'pedir', 'mendigar', 'limosna'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }
        
        const currencyName = await getCurrencyName(ctx);
        const COOLDOWN = 45 * 1000;
        const BASE_REWARD = Math.floor(Math.random() * 800) + 200;
        
        const userData = await ctx.dbService.getUser(ctx.sender);
        const lastBeg = userData.economy?.lastBeg || 0;
        const cooldown = getCooldown(lastBeg, COOLDOWN);
        
        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `ꕢ Ya pediste dinero hace poco.\nVuelve en: ${formatTime(cooldown)}`
            ));
        }

        const success = Math.random() > 0.25;
        if (success) {
            const result = getRandom(BEG_SUCCESS);
            const reward = Math.floor(BASE_REWARD * result.multi);
            const currentCoins = userData.economy?.coins || 0;
            
            await ctx.dbService.updateUser(ctx.sender, {
                'economy.lastBeg': Date.now(),
                'economy.coins': currentCoins + reward
            });
            
            await ctx.reply(styleText(
                `${result.emoji} ${result.text} *¥${formatNumber(reward)}* ${currencyName}!\n` +
                `💰 Balance: ¥${formatNumber(currentCoins + reward)}`
            ));
        } else {
            await ctx.dbService.updateUser(ctx.sender, { 'economy.lastBeg': Date.now() });
            const fail = getRandom(BEG_FAIL);
            await ctx.reply(styleText(`😔 ${fail}.\nNo ganaste nada esta vez.`));
        }
    }
};

export default command;
