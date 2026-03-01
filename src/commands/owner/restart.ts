import { isOwner, styleText } from '../../utils/helpers.js';
import { spawn } from 'child_process';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['restart', 'reiniciar', 'reboot'],
    async execute(ctx: CommandContext) {
        const { sender, reply } = ctx;
        if (!isOwner(sender)) {
            return await reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        await reply(styleText('🔄 *Reiniciando bot...*\n\n> Volveré en unos segundos~'));

        setTimeout(() => {
            logger.info('🔄 Bot reiniciando por comando del owner');
            const args = process.argv.slice(1);
            const child = spawn(process.argv[0], args, {
                detached: true,
                stdio: 'inherit',
                cwd: process.cwd()
            });
            child.unref();
            process.exit(0);
        }, 1500);
    }
};

export default command;
