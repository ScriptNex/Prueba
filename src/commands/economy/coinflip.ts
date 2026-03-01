import { formatNumber, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['coinflip', 'cf'],
    async execute(ctx: CommandContext) {
        if (ctx.args.length < 2) {
            return await ctx.reply(styleText('ꕢ Uso: */coinflip* `<cantidad>` `<cara/cruz>`'));
        }
        
        const amount = parseInt(ctx.args[0]);
        const choice = ctx.args[1].toLowerCase();
        
        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕢ La cantidad debe ser un número mayor a 0.'));
        }
        if (!['cara', 'cruz'].includes(choice)) {
            return await ctx.reply(styleText('ꕢ Debes elegir cara o cruz.'));
        }
        
        const userData = await ctx.dbService.getUser(ctx.sender);
        const currencyName = await getCurrencyName(ctx);
        const currentCoins = userData.economy?.coins || 0;
        
        if (currentCoins < amount) {
            return await ctx.reply(styleText(`ꕢ No tienes suficientes ${currencyName}.`));
        }
        
        const result = Math.random() < 0.5 ? 'cara' : 'cruz';
        const won = result === choice;
        
        if (won) {
            await ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': currentCoins + amount
            });
            await ctx.reply(styleText(`ꕣ ¡Salió *${result}*! Ganaste *¥${formatNumber(amount)}* ${currencyName}.`));
        } else {
            await ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': currentCoins - amount
            });
            await ctx.reply(styleText(`ꕢ Salió *${result}*. Perdiste *¥${formatNumber(amount)}* ${currencyName}.`));
        }
    }
};

export default command;
