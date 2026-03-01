import { isAdmin, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['nsfw'],
    async execute(ctx: CommandContext) {
        const { chatId, sender, senderLid, args, isGroup, bot, dbService, reply } = ctx;
        if (!isGroup) {
            return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }
        
        const userIdForAdmin = senderLid || sender;
        const admin = await isAdmin(bot, chatId, userIdForAdmin);
        
        if (!admin) {
            return await reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        }
        
        if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
            return await reply(styleText('ꕢ Uso » *#nsfw* <on/off>'));
        }
        
        const enable = args[0].toLowerCase() === 'on';
        const group = dbService.getGroup(chatId);
        if (!group.settings) group.settings = {};
        
        await dbService.updateGroup(chatId, {
            'settings.nsfw': enable
        });
        
        await reply(styleText(`ꕢ Comandos NSFW ${enable ? 'activados' : 'desactivados'}.`));
    }
};

export default command;
