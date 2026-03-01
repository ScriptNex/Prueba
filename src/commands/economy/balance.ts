import { formatNumberLarge, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['balance', 'bal', 'saldo'],
    async execute(ctx: CommandContext) {
        const currencyName = await getCurrencyName(ctx);
        const userData = await ctx.dbService.getUser(ctx.sender, ctx.senderLid);
        
        const economy = userData.economy || { coins: 0, bank: 0 };
        const coins = economy.coins || 0;
        const bank = economy.bank || 0;
        const total = coins + bank;

        await ctx.reply(styleText(
            `ꕣ *Balance de Usuario*\n\n` +
            `⟡ Billetera: *¥${formatNumberLarge(coins)}* ${currencyName}\n` +
            `⟡ Banco: *¥${formatNumberLarge(bank)}* ${currencyName}\n` +
            `⟡ Total: *¥${formatNumberLarge(total)}* ${currencyName}`
        ));
    }
};

export default command;
