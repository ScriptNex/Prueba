import { formatNumberLarge, styleText, getName, getCurrencyName } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['board', 'leaderboard', 'top', 'baltop'],
    async execute(ctx: CommandContext) {
        const { dbService, reply, bot, chatId, isGroup } = ctx;
        const users = await dbService.getTopUsers(10);

        if (users.length === 0) {
            return reply(styleText('ꕢ No hay usuarios con coins en este ranking.'));
        }

        let message = 'ꕣ Ranking Global de Economía\n\n';
        message += '➭ Top 10 Ricachones\n\n';

        const currencyName = await getCurrencyName(ctx);

        let groupMetadata: any = null;
        if (isGroup && chatId) {
            try {
                groupMetadata = await bot.groupMetadata(chatId);
            } catch (e: any) {
                logger.warn('No se pudo obtener metadata del grupo para leaderboards:', e.message);
            }
        }

        const usersWithNames = await Promise.all(users.map(async (user: any) => {
            let displayName = user.name;
            if (!displayName || displayName === 'Usuario') {
                try {
                    if (chatId) {
                        displayName = await getName(bot.sock, chatId, user.id);
                    }
                    if ((!displayName || displayName === 'Usuario') && groupMetadata) {
                        const participant = groupMetadata.participants.find((p: any) => p.id === user.id);
                        if (participant) {
                            displayName = participant.notify || participant.name || participant.verifiedName;
                        }
                    }
                    if (!displayName || displayName === 'Usuario') {
                        const contact = await (bot as any).getContact(user.id);
                        displayName = contact?.notify || contact?.name || contact?.verifiedName || contact?.pushname;
                    }
                } catch (e) {
                    // Silently fail name retrieval
                }
            }

            if (!displayName || displayName === 'Usuario') {
                displayName = user.id.split('@')[0];
            }
            return { ...user, displayName };
        }));

        const mentions: string[] = [];
        usersWithNames.forEach((user, i) => {
            const medal = i === 0 ? '❶' : i === 1 ? '❷' : i === 2 ? '❸' : `${i + 1}.`;
            const userNumber = user.id.split('@')[0];
            
            message += `${medal} @${userNumber}\n`;
            message += `> ⛃ Coins » *¥${formatNumberLarge(user.coins)}* ${currencyName}\n`;
            message += `> ❖ Banco » *¥${formatNumberLarge(user.bank)}* ${currencyName}\n`;
            message += `> ✧ Total » *¥${formatNumberLarge(user.total)}* ${currencyName}\n\n`;
            mentions.push(user.id);
        });

        message += '💫 _Sigue esforzándote!_';
        await reply(styleText(message), { mentions });
    }
};

export default command;
