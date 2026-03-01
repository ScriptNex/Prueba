import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, isBotAdmin, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['kickall', 'eliminaratodos'],
    tags: ['admin'],
    help: ['kickall'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        
        if (!await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender)) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        if (!await isBotAdmin(ctx.bot.sock, ctx.chatId)) return await ctx.reply(styleText('ꕢ Necesito ser administrador para eliminar miembros.'));
        
        try {
            const metadata = await ctx.bot.groupMetadata(ctx.chatId);
            const botLid = ctx.bot.sock.user?.lid?.split(':')[0]?.split('@')[0];
            const botNumber = ctx.bot.sock.user?.id?.split(':')[0]?.split('@')[0];
            
            const toKick = metadata.participants.filter((p: any) => {
                if (p.admin === 'admin' || p.admin === 'superadmin') return false;
                const participantId = p.id.split(':')[0].split('@')[0];
                return participantId !== botLid && participantId !== botNumber;
            });

            if (toKick.length === 0) return await ctx.reply(styleText('ꕢ No hay miembros para eliminar (solo hay administradores).'));
            
            await ctx.reply(styleText(`⚠️ *Iniciando eliminación masiva*\n📊 Eliminando ${toKick.length} miembros...`));
            
            const batchSize = 5;
            let kicked = 0;
            let failed = 0;

            for (let i = 0; i < toKick.length; i += batchSize) {
                const batch = toKick.slice(i, i + batchSize);
                const jids = batch.map((p: any) => p.id);
                try {
                    await ctx.bot.groupParticipantsUpdate(ctx.chatId, jids, 'remove');
                    kicked += jids.length;
                    if (i + batchSize < toKick.length) await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error('[AdminKickall] Error eliminando batch:', error);
                    failed += jids.length;
                }
            }
            
            await ctx.reply(styleText(`✅ *Eliminación completada*\n• Eliminados: ${kicked}\n• Fallidos: ${failed}`));
        } catch (error) {
            console.error('[AdminKickall] Error:', error);
            await ctx.reply(styleText('ꕢ Error al eliminar miembros del grupo.'));
        }
    }
};

export default command;
