import { jadibotManager } from '../../services/external/jadibot.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['qr'],
    async execute(ctx: CommandContext) {
        const { args, reply, chatId, bot } = ctx;
        
        if (!args[0]) {
            return await reply(styleText('ꕢ Debes proporcionar un código.\nUso: #qr <código>'));
        }
        
        await reply(styleText('⏳ Iniciando sub-bot con QR, por favor espera...'));
        const result = await (jadibotManager as any).startSubbot(args[0], chatId, bot?.sock);
        if (!result.success) {
            await reply(styleText(result.message));
        }
    }
};

export default command;
