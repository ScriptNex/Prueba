import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['obtenerinfo', 'getinfo', 'userinfo'],
    tags: ['tools'],
    help: ['obtenerinfo @usuario'],
    async execute(ctx: CommandContext) {
        const { msg, bot, chatId, isGroup, reply } = ctx;
        const msgAny: any = msg;

        if (!isGroup) {
            return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }

        const mentionedJid = msgAny.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) {
            return await reply(styleText('ꕢ Debes etiquetar a un usuario.\nEjemplo: #obtenerinfo @usuario'));
        }

        const targetUser = mentionedJid[0];

        try {
            const metadata = await bot?.sock.groupMetadata(chatId);
            const participants = metadata?.participants || [];
            const phoneNumber = targetUser.split('@')[0].split(':')[0];
            const participant = participants.find((p: any) => {
                const participantNumber = p.id.split('@')[0].split(':')[0];
                return participantNumber === phoneNumber;
            });

            let message = `📱 *Información del Usuario*\n\n`;
            message += `👤 *Mencionado como:* @${targetUser.split('@')[0]}\n\n`;
            message += `📞 *Número base:* ${phoneNumber}\n\n`;
            message += `🔗 *Formatos de JID:*\n`;
            message += `• PN (Phone Number): \`${phoneNumber}@s.whatsapp.net\`\n`;

            if (participant) {
                message += `• LID (Linked ID): \`${participant.id}\`\n`;
            } else {
                message += `• LID: _No encontrado en el grupo_\n`;
            }

            await reply(styleText(message), { mentions: [targetUser] });
        } catch (error) {
            logger.error('Error en obtenerinfo:', error);
            await reply(styleText('ꕢ Error al obtener la información del usuario.'));
        }
    }
};

export default command;
