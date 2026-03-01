import { jadibotManager } from '../../services/external/jadibot.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['listjadibot', 'listbots'],
    async execute(ctx: CommandContext) {
        const { reply } = ctx;
        const subbots = (jadibotManager as any).getSubbots();
        
        if (subbots.length === 0) {
            return await reply(styleText('ꕢ No hay sub-bots activos actualmente.'));
        }
        
        let message = `ꕢ *Sub-Bots Activos* (${subbots.length})\n\n`;
        subbots.forEach((bot: any, i: number) => {
            const phoneNumber = bot.userId.split('@')[0];
            message += `${i + 1}. @${phoneNumber}\n`;
        });
        
        await reply(styleText(message), {
            mentions: subbots.map((b: any) => b.userId) 
        });
    }
};

export default command;
