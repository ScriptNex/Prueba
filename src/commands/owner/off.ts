import { isOwner, styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['off', 'apagar', 'shutdown'],
    async execute(ctx: CommandContext) {
        const { sender, reply } = ctx;
        if (!isOwner(sender)) {
            return await reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        await reply(styleText('🔴 *Apagando bot...*\n\n> Hasta pronto~'));

        setTimeout(() => {
            logger.info('🔴 Bot apagado por comando del owner');
            process.exit(0);
        }, 1500);
    }
};

export default command;
