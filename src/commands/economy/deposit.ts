import { formatNumber, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['deposit', 'dep', 'depositar', 'd'],
    async execute(ctx: CommandContext) {
        if (ctx.args.length === 0) {
            return await ctx.reply(styleText('ꕢ Uso: *#deposit* <cantidad|all>'));
        }
        
        const userData = await ctx.dbService.getUser(ctx.sender);
        const economy = userData.economy || { coins: 0, bank: 0 };
        
        let amount: number;
        if (ctx.args[0].toLowerCase() === 'all') {
            amount = economy.coins || 0;
        } else {
            amount = parseInt(ctx.args[0]);
        }

        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕢ La cantidad debe ser un número mayor a 0.'));
        }
        
        if ((economy.coins || 0) < amount) {
            return await ctx.reply(styleText('ꕢ No tienes suficientes coins en tu billetera.'));
        }

        const currencyName = await getCurrencyName(ctx);
        const coins = economy.coins || 0;
        const bank = economy.bank || 0;
        
        await ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': coins - amount,
            'economy.bank': bank + amount
        });
        
        await ctx.dbService.save();
        await ctx.reply(styleText(`ꕣ Depositaste *¥${formatNumber(amount)}* ${currencyName} en el banco.`));
    }
};

export default command;
