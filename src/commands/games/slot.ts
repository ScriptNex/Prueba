import { formatNumber, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['slot', 'slots', 'tragaperras'],
    async execute(ctx: CommandContext) {
        const { chatId, dbService, sender, args, reply, isGroup } = ctx;
        
        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (groupData && groupData.settings && !groupData.settings.economy) {
                return await reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }
        
        const userData = dbService.getUser(sender);
        const userEconomics = userData.economy || { coins: 0 };
        
        let amount = parseInt(args[0]);
        if (!amount || isNaN(amount) || amount <= 0) {
            return await reply(styleText('ꕢ Uso: #slot <cantidad>\n> Ejemplo: * #slot* 100'));
        }
        
        if (amount > userEconomics.coins) {
            return await reply(styleText('ꕢ No tienes suficientes coins.'));
        }
        
        const emojis = ['🍇', '🍉', '🍊', '🍋', '🍌', '🍍', '🍒', '🍓'];
        const a = emojis[Math.floor(Math.random() * emojis.length)];
        const b = emojis[Math.floor(Math.random() * emojis.length)];
        const c = emojis[Math.floor(Math.random() * emojis.length)];
        
        let resultMsg = '';
        let winAmount = 0;
        let newBalance = userEconomics.coins - amount;
        
        if (a === b && b === c) {
            winAmount = amount * 5;
            newBalance += winAmount;
            resultMsg = `ꕣ *JACKPOT!!!* \n\n> ➵Ganaste *${formatNumber(winAmount)}* coins (x5)`;
        } else if (a === b || b === c || a === c) {
            winAmount = Math.floor(amount * 1.5);
            newBalance += winAmount;
            resultMsg = `ꕣ *¡Ganaste!* \n\n> ✐ Ganaste *${formatNumber(winAmount)}* coins (x1.5)`;
        } else {
            resultMsg = `ꕢ *Perdiste* \n\n> ✐ Perdiste *${formatNumber(amount)}* coins`;
        }
        
        dbService.updateUser(sender, { 'economy.coins': newBalance });
        await reply(styleText(`ꕣ *SLOTS* 🎰\n\n❐ | ${a} | ${b} | ${c} | 👈\n\n${resultMsg}\n> Nuevo balance: ${formatNumber(newBalance)} coins`));
    }
};

export default command;
