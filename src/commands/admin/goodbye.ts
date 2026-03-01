import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['goodbye'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) return await ctx.reply(styleText('ꕢ Uso: */goodbye* `<on/off>`'));
        
        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            const result = await ctx.dbService.updateGroup(ctx.chatId, { 'settings.goodbye': enable });
            if (result) await ctx.reply(styleText(`ꕣ Despedidas ${enable ? 'activadas ✅' : 'desactivadas ❌'}.`));
            else throw new Error('Database update failed');
        } catch (error) {
            console.error('[AdminGoodbye] Error:', error);
            await ctx.reply(styleText('ꕢ Error al cambiar la configuración de despedidas.'));
        }
    }
};

export default command;
