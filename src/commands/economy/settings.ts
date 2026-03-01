import { styleText, isAdmin } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['economy'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) {
            return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }

        const userIdForAdmin = ctx.senderLid || ctx.sender;
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, userIdForAdmin);
        
        if (!admin) {
            return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            return await ctx.reply(styleText('ꕢ Uso: *#economy* `<on/off>`'));
        }

        const enable = ctx.args[0].toLowerCase() === 'on';
        await ctx.dbService.updateGroup(ctx.chatId, { 'settings.economy': enable });
        await ctx.reply(styleText(`ꕣ Sistema de economía ${enable ? 'activado' : 'desactivado'}.`));
    }
};

export default command;
