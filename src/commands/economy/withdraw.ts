import { formatNumber, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['withdraw', 'wd'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }
        
        const user = await ctx.dbService.getUser(ctx.sender);
        const economy = user.economy || { bank: 0, coins: 0 };
        
        if (!ctx.args[0]) {
            return await ctx.reply(styleText('ꕢ Debes especificar una cantidad.\nUso: #withdraw <cantidad>'));
        }
        
        const bank = economy.bank || 0;
        const coins = economy.coins || 0;
        
        const amount = ctx.args[0].toLowerCase() === 'all' ? bank : parseInt(ctx.args[0]);
        
        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕢ Cantidad inválida.'));
        }
        if (amount > bank) {
            return await ctx.reply(styleText('ꕢ No tienes suficientes coins en el banco.'));
        }
        
        const currencyName = await getCurrencyName(ctx);
        
        await ctx.dbService.updateUser(ctx.sender, {
            'economy.bank': bank - amount,
            'economy.coins': coins + amount
        });
        
        await ctx.dbService.save();
        
        await ctx.reply(styleText(
            `ꕣ *Retiro Exitoso*\n\n` +
            `> ✿ Retiraste » *¥${formatNumber(amount)}* ${currencyName}\n` +
            `> ✿ ${currencyName} » *¥${formatNumber(coins + amount)}*\n` +
            `> ✿ Banco » *¥${formatNumber(bank - amount)}*`
        ));
    }
};

export default command;
