import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, isBotAdmin, extractMentions, styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';

const command: Command = {
    commands: ['ban'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        
        const botAdmin = await isBotAdmin(ctx.bot.sock, ctx.chatId);
        if (!botAdmin) return await ctx.reply(styleText('ꕢ Necesito ser administrador para banear usuarios.'));
        
        const mentions = extractMentions(ctx);
        if (mentions.length === 0) return await ctx.reply(styleText('ꕢ Debes mencionar al usuario a banear.\n\n> _Uso: #ban @usuario_'));
        
        const user = mentions[0];
        try {
            const groupMetadata = await ctx.bot.groupMetadata(ctx.chatId);
            const phoneNumber = user.split('@')[0].split(':')[0];
            const participant = groupMetadata.participants.find((p: any) => p.id.split('@')[0].split(':')[0] === phoneNumber);
            
            if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                return await ctx.reply(styleText(`ꕢ No puedo banear a @${phoneNumber} porque es administrador.`), { mentions: [user] });
            }
            
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (groupData?.banned?.includes(user)) return await ctx.reply(styleText('ꕢ Ese usuario ya está baneado.'));
            
            await ctx.dbService.updateGroup(ctx.chatId, { $push: { banned: user } });
            if (participant) await ctx.bot.groupParticipantsUpdate(ctx.chatId, [participant.id], 'remove');
            
            logger.info(`[AdminBan] Usuario ${user} baneado exitosamente del grupo ${ctx.chatId}`);
            await ctx.reply(styleText(`ꕣ @${user.split('@')[0]} ha sido baneado del grupo.`), { mentions: [user] });
        } catch (error: any) {
            logger.error(`[AdminBan] Error: ${error.message}`, error);
            await ctx.reply(styleText('ꕢ Error al banear al usuario: ' + error.message));
        }
    }
};

export default command;
