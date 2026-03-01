import { formatNumber, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['roulette', 'rt'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }
        
        const userData = await ctx.dbService.getUser(ctx.sender);
        const userCoins = userData.economy?.coins || 0;
        const currencyName = await getCurrencyName(ctx);

        if (!ctx.args[0] || !ctx.args[1]) {
            return await ctx.reply(styleText('ꕢ Uso incorrecto.\n> Uso: *#roulette* `<red/black>` `<cantidad>`'));
        }

        const choice = ctx.args[0].toLowerCase();
        const amount = parseInt(ctx.args[1]);

        if (!['red', 'black'].includes(choice)) {
            return await ctx.reply(styleText('ꕢ Debes elegir: red o black'));
        }
        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕢ Cantidad inválida.'));
        }
        if (amount > userCoins) {
            return await ctx.reply(styleText(`ꕢ No tienes suficientes ${currencyName}.`));
        }

        const result = Math.random() < 0.5 ? 'red' : 'black';
        const won = result === choice;

        if (won) {
            const winAmount = Math.floor(amount * 1.8);
            const newBalance = userCoins + winAmount;
            await ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': newBalance
            });
            await ctx.reply(styleText(
                `ꕣ *¡Ganaste!*\n\n` +
                `Salió: ${result} ${result === 'red' ? '🔴' : '⚫'}\n` +
                `Ganancia: +${formatNumber(winAmount)} ${currencyName}\n` +
                `Balance: ${formatNumber(newBalance)} ${currencyName}`
            ));
        } else {
            const newBalance = Math.max(0, userCoins - amount);
            await ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': newBalance
            });
            await ctx.reply(styleText(
                `ꕣ *Perdiste*\n\n` +
                `Salió: ${result} ${result === 'red' ? '🔴' : '⚫'}\n` +
                `Pérdida: -${formatNumber(amount)} ${currencyName}\n` +
                `Balance: ${formatNumber(newBalance)} ${currencyName}`
            ));
        }
    }
};

export default command;
