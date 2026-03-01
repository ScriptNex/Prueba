import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, isBotAdmin, styleText, isOwner } from '../../utils/helpers.js';
import { findParticipant } from '../../utils/permissions.js';

const botAdminCache = new Map<string, boolean>();

const command: Command = {
    commands: ['antilink'],
    async before(ctx: CommandContext) {
        const { isGroup, body, sender, chatId, dbService, bot, msg } = ctx;
        if (!isGroup || !body) return;

        const groupData = await dbService.getGroup(chatId);
        if (!groupData?.settings?.antilink) return;

        const linkRegex = /(chat\.whatsapp\.com\/[a-zA-Z0-9]+)|(whatsapp\.com\/channel\/[a-zA-Z0-9]+)/i;
        if (!linkRegex.test(body)) return;

        if (await isAdmin(bot.sock, chatId, sender) || isOwner(sender)) return;

        let botIsAdmin = botAdminCache.get(chatId);
        if (botIsAdmin === undefined) {
            botIsAdmin = await isBotAdmin(bot.sock, chatId);
            botAdminCache.set(chatId, botIsAdmin);
            setTimeout(() => botAdminCache.delete(chatId), 5 * 60 * 1000);
        }

        if (!botIsAdmin) return;

        try { 
            await bot.sock.sendMessage(chatId, { delete: msg.key }); 
        } catch (e) { 
            console.error('[Antilink] Error al eliminar mensaje:', e); 
        }

        try {
            const participant = await findParticipant(bot.sock, chatId, sender);
            if (participant && participant.id) {
                await bot.sock.groupParticipantsUpdate(chatId, [participant.id], 'remove');
                const userNumber = sender.split('@')[0].split(':')[0];
                await bot.sock.sendMessage(chatId, { 
                    text: styleText(`@${userNumber} eliminado por enviar enlaces prohibidos (¬_¬")`), 
                    mentions: [`${userNumber}@s.whatsapp.net`] 
                });
            }
        } catch (e) { 
            console.error('[Antilink] Error al eliminar usuario:', e); 
        }
    },
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        
        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            return await ctx.reply(styleText('ꕢ Uso: */antilink* `<on/off>`'));
        }

        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            await ctx.dbService.updateGroup(ctx.chatId, { 'settings.antilink': enable });
            botAdminCache.delete(ctx.chatId);
            await ctx.reply(styleText(`ꕣ Antilink ${enable ? 'activado ✅' : 'desactivado ❌'}.`));
        } catch (error) { 
            await ctx.reply(styleText('ꕢ Error al cambiar la configuración.')); 
        }
    }
};

export default command;
