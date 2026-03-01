import { styleText, sleep } from '../../utils/helpers.js';
import { OWNER_JID } from '../../config/constants.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['allgroups', 'broadcastgroups', 'bcgroups', 'tx'],
    async execute(ctx: CommandContext) {
        const { sender, senderPhone, args, reply, bot } = ctx;
        const ownerJid = OWNER_JID || '';

        const isOwner = sender === ownerJid ||
            senderPhone === ownerJid.split('@')[0] ||
            sender.split('@')[0] === ownerJid.split('@')[0];

        if (!isOwner) {
            return await reply(styleText('ꕢ Este comando es solo para el dueño del bot.'));
        }

        const message = args.join(' ');
        if (!message) {
            return await reply(styleText('ꕢ Por favor escribe el mensaje a transmitir.'));
        }

        await reply(styleText('ꕢ Iniciando transmisión a todos los grupos...'));

        try {
            const groups = await bot.sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            let sent = 0;
            let failed = 0;
            const broadcastMsg = `ꕣ *COMUNICADO OFICIAL* ꕣ\n\n${message}\n\n> 📢 Transmisión Global para Grupos`;

            for (const groupId of groupIds) {
                try {
                    await bot.sock.sendMessage(groupId, { text: styleText(broadcastMsg) });
                    sent++;
                    await sleep(1500);
                } catch (error: any) {
                    logger.error(`Error enviando a ${groupId}:`, error.message);
                    failed++;
                }
            }

            await reply(styleText(
                `✅ *Transmisión Finalizada*\n\n` +
                `> 📤 Enviados: ${sent}\n` +
                `> ❌ Fallidos: ${failed}\n` +
                `> 👥 Total Grupos: ${groupIds.length}`
            ));
        } catch (error: any) {
            logger.error('[BroadcastGroups] Error:', error);
            await reply(styleText(`❌ Error al obtener grupos: ${error.message}`));
        }
    }
};

export default command;
