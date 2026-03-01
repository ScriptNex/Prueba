import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['alertas'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) return await ctx.reply(styleText('ꕢ Uso: */alertas* `<on/off>`'));
        
        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            await ctx.dbService.updateGroup(ctx.chatId, { 'settings.alerts': enable });
            await ctx.reply(styleText(`ꕣ Sistema de alertas ${enable ? 'activado ✅' : 'desactivado ❌'}.`));
        } catch (error) {
            console.error('[AdminAlertas] Error:', error);
            await ctx.reply(styleText('ꕢ Error al cambiar la configuración de alertas.'));
        }
    }
};

export default command;
