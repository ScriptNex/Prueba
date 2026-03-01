import { isBotAdmin, styleText, isAdmin } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['link', 'enlace'],
    tags: ['group'],
    help: ['link'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, isGroup, reply, sender, senderLid } = ctx;
        const conn = bot?.sock;

        if (!isGroup) {
            return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }

        const userIdForAdmin = senderLid || sender;
        const isAdminUser = await isAdmin(bot, chatId, userIdForAdmin);

        if (!isAdminUser) {
            return await reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        }

        if (!conn) {
            return await reply(styleText('❌ Error: Conexión no disponible.'));
        }

        try {
            const botIsAdmin = await isBotAdmin(conn, chatId);
            if (!botIsAdmin) {
                return await reply(styleText('ꕢ Necesito ser administrador para obtener el enlace del grupo.'));
            }

            const code = await conn.groupInviteCode(chatId);
            const link = `https://chat.whatsapp.com/${code}`;
            await reply(styleText(`ꕣ *Enlace del Grupo* \n\n${link}`));
        } catch (error) {
            console.error('[Link] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al obtener el enlace.'));
        }
    }
};

export default command;
