import { jadibotManager } from '../../services/external/jadibot.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['logoutallbots', 'clearallsessions'],
    help: ['Elimina permanentemente TODAS las sesiones de sub-bots. (Solo Owner)'],
    async execute(ctx: CommandContext) {
        const { isOwner, reply } = ctx;
        if (!isOwner) return reply('ꕢ Este comando solo puede ser usado por el Owner.');
        
        const result = await jadibotManager.logoutAllSubbots();
        await reply(styleText(result.message));
    }
};

export default command;
