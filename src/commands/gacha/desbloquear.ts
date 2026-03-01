import { extractMentions, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['desbloquear', 'unlock'],
    async execute(ctx: CommandContext) {
        const { userData, dbService, reply, sender } = ctx;
        const mentions = extractMentions(ctx);

        if (mentions.length === 0) {
            return await reply(styleText('✘ Debes mencionar a alguien.\n\nEjemplo:\n*#desbloquear @usuario*'));
        }

        const target = mentions[0];
        const targetData = dbService.getUser(target);

        const coins = userData.economy?.coins || userData.monedas || 0;
        const costo = 100000;
        const duracion = 3 * 60 * 1000;

        if (coins < costo) {
            return await reply(
                styleText(`✘ No tienes suficientes monedas.\n` +
                    `Necesitas *${costo.toLocaleString()}* monedas para desbloquear la base de @${target.split('@')[0]}.`),
                { mentions: [target] }
            );
        }

        const newCoins = coins - costo;
        const unlockTime = Date.now() + duracion;

        await dbService.updateUser(sender, { 'economy.coins': newCoins });
        await dbService.updateUser(target, { 
            'desbloqueo': unlockTime,
            'antirobo': 0 
        });

        await reply(
            styleText(`> 𐚁 *Base desbloqueada*.\n` +
                `⟡ @${target.split('@')[0]} ahora está vulnerable por 3 minutos.\n` +
                `⟡ Podrás robar sus waifus hasta: *${new Date(unlockTime).toLocaleString()}*`),
            { mentions: [target] }
        );
    }
};

export default command;
