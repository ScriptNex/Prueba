import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['vchars', 'characterstats'],
    help: ['Muestra el número de personajes ocupados y el total de personajes en la base de datos.'],
    async execute(ctx: CommandContext) {
        const { gachaService, reply } = ctx;
        if (!gachaService) return;

        const stats = gachaService.getStats();
        const { total, owned } = stats;

        const message = `ꕣ *Estadísticas de Personajes*\n\n` +
                        `➭ ${owned}/${total} personajes ocupados\n\n` +
                        `> _Usa #harem para ver tus personajes reclamados_`;

        await reply(styleText(message));
    }
};

export default command;
