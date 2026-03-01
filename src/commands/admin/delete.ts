import { Command, CommandContext } from '../../types/Command.js';
import { isBotAdmin, isAdmin, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['del', 'delete', 'eliminar', 'dd'],
    tags: ['admin'],
    help: ['delete (responde a un mensaje)'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, isGroup, msg, reply, sender, senderLid } = ctx;
        const conn = bot?.sock;
        
        if (!isGroup) return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        
        const userIdForAdmin = senderLid || sender;
        if (!await isAdmin(conn, chatId, userIdForAdmin)) {
            return await reply(styleText('ꕢ Necesitas ser administrador para usar este comando.'));
        }
        
        if (!await isBotAdmin(conn, chatId)) {
            return await reply(styleText('ꕢ Necesito ser administrador para eliminar mensajes.'));
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        if (!quoted?.quotedMessage) {
            return await reply(styleText('ꕢ Por favor responde al mensaje que quieres eliminar.'));
        }

        const participant = quoted.participant || (quoted as any).remoteJid;
        const deleteKey = {
            remoteJid: chatId,
            fromMe: participant === conn.user.id.split(':')[0] + '@s.whatsapp.net',
            id: quoted.stanzaId,
            participant: participant
        };

        try { 
            await conn.sendMessage(chatId, { delete: deleteKey }); 
        } catch (e) { 
            console.error('[Delete] Error:', e); 
            await reply(styleText('ꕢ Error al eliminar el mensaje.')); 
        }
    }
};

export default command;
