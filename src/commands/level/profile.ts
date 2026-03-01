import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['level', 'lvl', 'rank', 'xp'],
    async execute(ctx: CommandContext) {
        const { levelService, sender, from, reply } = ctx;
        if (!levelService) return;

        const rank = await levelService.getRank(sender);
        const barLength = 20;
        const filled = Math.floor((rank.progress / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

        const text = `╭─────── ୨୧ ───────╮
│ *Rango de usuario*
╰────────────────╯
✿ *::* *Usuario* › ${from.name}
✿ *::* *Nivel*   › ${rank.level}
✿ *::* *XP*      › ${rank.xp} / ${rank.required}

╭─── ⚐ Progreso ───╮
│ [${bar}] ${rank.progress}%
╰────────────────╯`;

        return await reply(styleText(text));
    }
};

export default command;
