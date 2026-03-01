import { styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['love', 'amor', 'ship'],
    tags: ['fun'],
    help: ['love @user'],
    async execute(ctx: CommandContext) {
        const { msg, bot, text, sender, chatId, from } = ctx;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        let target = '';
        if (mentionedJid && mentionedJid.length > 0) {
            target = mentionedJid[0];
        } else {
            return await ctx.reply(styleText('ꕤ Etiqueta a alguien para calcular el amor.'));
        }

        const senderName = from?.name || sender.split('@')[0];
        const targetName = await getName(bot.sock, chatId, target);

        const percentage = Math.floor(Math.random() * 101);
        let message = '';

        if (percentage < 25) {
            message = '💔 No hay futuro aquí...';
        } else if (percentage < 50) {
            message = '😐 Podría funcionar con esfuerzo.';
        } else if (percentage < 75) {
            message = '❤️ Hay buena química.';
        } else {
            message = '💖 ¡Son almas gemelas!';
        }

        const response = `*Calculadora de Amor* 💘\n\n` +
            `🔻 *${senderName}* + *${targetName}*\n` +
            `📊 *Porcentaje:* ${percentage}%\n` +
            `📝 *Resultado:* ${message}`;

        await ctx.reply(styleText(response), { mentions: [sender, target] });
    }
};

export default command;
