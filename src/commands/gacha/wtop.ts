import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['wtop', 'topwaifus'],
    async execute(ctx: CommandContext) {
        const { gachaService, reply } = ctx;
        if (!gachaService) return;

        const waifus = gachaService.characters
            .filter(c => (c.votes || 0) > 0)
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .slice(0, 10);

        if (waifus.length === 0) {
            return await reply(styleText('ꕢ No hay votos registrados aún.'));
        }

        let message = 'ꕣ Ranking de Popularidad\n\n';
        message += '➭ Top 10 Personajes más Votados\n\n';
        
        waifus.forEach((waifu, i) => {
            const medal = i === 0 ? '❶' : i === 1 ? '❷' : i === 2 ? '❸' : `${i + 1}.`;
            message += `${medal} Nombre » ${waifu.name || 'Desconocido'}\n`;
            message += `> ⚘ Votos » ${waifu.votes || 0}\n\n`;
        });

        await reply(styleText(message));
    }
};

export default command;
