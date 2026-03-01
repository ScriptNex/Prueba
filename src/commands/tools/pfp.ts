import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['pfp', 'perfil', 'foto'],
    tags: ['tools'],
    help: ['pfp [@user]'],
    async execute(ctx: CommandContext) {
        const { chatId, msg, bot, sender, reply } = ctx;
        const conn = bot?.sock;
        const msgAny: any = msg;

        if (!conn) {
            return await reply(styleText('❌ Error: Conexión no disponible.'));
        }

        let targetJid = sender;
        const mentions = msgAny.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (mentions && mentions.length > 0) {
            targetJid = mentions[0];
        } else if (msgAny.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetJid = msgAny.message.extendedTextMessage.contextInfo.participant;
        }

        try {
            let pfpUrl;
            try {
                pfpUrl = await conn.profilePictureUrl(targetJid, 'image');
            } catch (e) {
                pfpUrl = null;
            }

            if (!pfpUrl) {
                return await reply(styleText('ꕢ El usuario no tiene foto de perfil o es privada.'));
            }

            const caption = `ꕣ *Profile Picture*\n\n` +
                `> *Usuario* » @${targetJid.split('@')[0]}\n` +
                `──────────────────\n` +
                `> _*Powered By DeltaByte*_`;

            await conn.sendMessage(chatId, {
                image: { url: pfpUrl },
                caption: styleText(caption),
                mentions: [targetJid]
            });
        } catch (error) {
            logger.error('[PFP] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al obtener la foto. Inténtalo más tarde.'));
        }
    }
};

export default command;
