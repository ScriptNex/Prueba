import { isOwner, extractMentions, formatNumber, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['wcoins', 'addcoins'],
    async execute(ctx: CommandContext) {
        const { sender, reply, bot, chatId, isGroup, args, dbService, msg } = ctx;
        
        if (!isOwner(sender)) {
            return await reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        const mentioned = extractMentions(ctx);
        const quoted = (msg.message as any)?.extendedTextMessage?.contextInfo?.participant;

        let targetUser: string | null = null;

        if (mentioned.length > 0) {
            targetUser = mentioned[0];
        } else if (quoted) {
            targetUser = quoted;
        }

        if (targetUser && (targetUser.includes('@lid') || !targetUser.includes('@s.whatsapp.net'))) {
            if (isGroup) {
                try {
                    const groupMetadata = await bot?.sock.groupMetadata(chatId);
                    const participant = groupMetadata?.participants.find((p: any) => p.lid === targetUser || p.id === targetUser);
                    if (participant && participant.id) {
                        targetUser = participant.id;
                    }
                } catch (e) {
                    console.error('Error resolving LID in wcoins:', e);
                }
            }

            if (targetUser!.includes('@lid')) {
                return await reply(styleText('ꕤ No se pudo verificar el usuario destino. Intenta mencionarlo nuevamente o esperar unos segundos.'));
            }
        }

        if (!targetUser) {
            return await reply(styleText(
                'ꕣ *WCOINS - Dar Coins (Owner)*\n\n' +
                '> Uso » *#wcoins* @usuario <cantidad>\n' +
                '> O responde a alguien + *#wcoins* <cantidad>\n\n' +
                '> Da coins ilimitadas a cualquier usuario'
            ));
        }

        const amountStr = args.find(arg => !isNaN(parseInt(arg)));
        const amount = amountStr ? parseInt(amountStr) : 0;
        
        if (!amount || amount <= 0) {
            return await reply(styleText('✘ Especifica una cantidad válida de coins.'));
        }

        if (!dbService) {
            return await reply(styleText('❌ Error: Database service no disponible.'));
        }

        const targetData = await dbService.getUser(targetUser);
        if (!targetData.economy) {
            targetData.economy = { coins: 0 };
        }

        const newBalance = (targetData.economy.coins || 0) + amount;

        await dbService.updateUser(targetUser, {
            'economy.coins': newBalance
        });

        const targetNumber = targetUser.split('@')[0].split(':')[0];
        const currencyName = await getCurrencyName(ctx);

        await reply(styleText(
            `ꕣ *Coins Añadidas*\n\n` +
            `> Usuario » @${targetNumber}\n` +
            `> Cantidad » +¥${formatNumber(amount)} ${currencyName}\n` +
            `> Nuevo balance » ¥${formatNumber(newBalance)} ${currencyName}`),
            { mentions: [targetUser] }
        );
    }
};

export default command;
