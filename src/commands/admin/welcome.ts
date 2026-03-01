import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['welcome'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) return await ctx.reply(styleText('ꕢ Uso: */welcome* `<on/off>`'));
        
        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            const result = await ctx.dbService.updateGroup(ctx.chatId, { 'settings.welcome': enable });
            if (result) await ctx.reply(styleText(`ꕣ Bienvenidas ${enable ? 'activadas ✅' : 'desactivadas ❌'}.`));
            else throw new Error('Database update failed');
        } catch (error) {
            console.error('[AdminWelcome] Error:', error);
            await ctx.reply(styleText('ꕢ Error al cambiar la configuración de bienvenidas.'));
        }
    }
};

export default command;
