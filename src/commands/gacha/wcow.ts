import { formatTime, getCooldown, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['wcow', 'waifu-cooldown'],
    tags: ['gacha'],
    help: ['wcow'],
    async execute(ctx: CommandContext) {
        const { userData, gachaService, sender, reply } = ctx;
        if (!gachaService) return;

        const ROLL_COOLDOWN = 10 * 60 * 1000;
        const lastRoll = userData.gacha?.lastRoll || 0;
        const rollCooldown = getCooldown(lastRoll, ROLL_COOLDOWN);

        let message = `ꕣ *INFORMACIÓN DE WAIFUS*\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━\n`;
        message += `✦ *ROLL WAIFU (RW)*\n`;
        
        if (rollCooldown > 0) {
            message += `✦ Cooldown activo\n`;
            message += `> Tiempo restante » *${formatTime(rollCooldown)}*\n`;
        } else {
            message += `✦ Disponible para usar\n`;
        }

        message += `\n━━━━━━━━━━━━━━━━━━━\n`;
        message += `✦ *CLAIM*\n`;
        message += `✦ Disponible (sin cooldown)\n\n`;

        const userWaifus = gachaService.getByOwner(sender);
        
        message += `━━━━━━━━━━━━━━━━━━━\n`;
        message += `✦ *TUS WAIFUS*\n`;
        message += `> Total » ${userWaifus.length}\n\n`;

        if (userWaifus.length > 0) {
            message += `_Tus 5 últimas waifus:_\n`;
            userWaifus.slice(-5).forEach((w, i) => {
                message += `${i + 1}. ${w.name} (${w.source || 'Desconocido'})\n`;
            });
        } else {
            message += `_No tienes waifus aún_`;
        }

        await reply(styleText(message));
    }
};

export default command;
