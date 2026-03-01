import { isAdmin, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['setprimary', 'setmain', 'botprincipal'],
    tags: ['owner', 'group'],
    help: ['setprimary @bot', 'setprimary off'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, isGroup, args, sender, reply, dbService, isOwner } = ctx;
        const conn = bot?.sock;
        
        if (!isGroup) {
            return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }
        
        if (!await isAdmin(conn, chatId, sender) && !isOwner) {
            return await reply(styleText('ꕢ Necesitas ser administrador para usar este comando.'));
        }

        const input = args[0]?.toLowerCase();
        
        if (!dbService) {
             return await reply(styleText('❌ Error: Database service no disponible.'));
        }

        if (input === 'off' || input === 'disable' || input === 'reset' || input === 'apagar') {
             await dbService.updateGroup(chatId, { primaryBot: null });
             return await reply(styleText('ꕢ Se ha desactivado el bot principal. Ahora responderán todos los bots.'));
        }

        let targetBotId: string | null = null;
        
        const msg: any = ctx.msg;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetBotId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            targetBotId = targetBotId?.split('@')[0] || null;
        } 
        else if (input && !isNaN(parseInt(input))) {
            targetBotId = input;
        }
        else {
            if (conn?.user?.id) {
                targetBotId = conn.user.id.split(':')[0];
            } else {
                 return await reply(styleText('ꕢ Error: No se pudo obtener la ID del bot.'));
            }
        }

        if (!targetBotId) {
             return await reply(styleText('ꕢ No se pudo identificar el bot.'));
        }

        await dbService.updateGroup(chatId, { primaryBot: targetBotId });
        
        const currentBotId = conn?.user?.id?.split(':')[0];
        const targetBotName = (currentBotId && targetBotId === currentBotId) ? (conn?.user?.name || 'Este Bot') : `@${targetBotId}`;
        
        await reply(styleText(`ꕣ *Bot Principal Configurado*\n\n> Bot: ${targetBotName}\n\nAhora solo este bot responderá a los comandos en este grupo.`));
    }
};

export default command;
