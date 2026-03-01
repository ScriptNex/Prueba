import { jadibotManager } from '../../services/external/jadibot.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['logoutbot', 'delsession', 'borrarbot'],
    help: ['Elimina permanentemente la sesión de tu sub-bot.'],
    async execute(ctx: CommandContext) {
        const { sender, reply } = ctx;
        const userId = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;
        const result = await jadibotManager.logoutSubbot(userId);
        await reply(styleText(result.message));
    }
};

export default command;
