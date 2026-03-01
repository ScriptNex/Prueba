import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['slap', 'bofetada', 'cachetada', 'pegar'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;

        let who: string;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        } else {
            who = sender;
        }

        const senderName = from.name || sender.split('@')[0];
        let targetName: string;

        if (who === sender) {
            targetName = 'alguien';
        } else {
            targetName = await getName(bot.sock, chatId, who);
        }

        try {
            const videos = [
                "https://files.catbox.moe/se59k0.mp4",
                "https://files.catbox.moe/h5ey57.mp4",
                "https://files.catbox.moe/g6o0mj.mp4",
                "https://files.catbox.moe/cvotxb.mp4",
                "https://files.catbox.moe/7q3xsf.mp4"
            ];

            const url = videos[Math.floor(Math.random() * videos.length)];

            let str: string;
            if (who === sender) {
                str = styleText(`\`${senderName}\` se dio una bofetada a sí mismo/a.`);
            } else {
                str = styleText(`\`${senderName}\` le dio una tremenda bofetada a \`${targetName}\``);
            }

            await bot.sock.sendMessage(chatId, {
                video: { url: url },
                caption: str,
                gifPlayback: true,
                mentions: who !== sender ? [who] : []
            }, { quoted: msg });

        } catch (e) {
            console.error('[Slap] Error:', e);
            await ctx.reply(styleText('ꕤ Error al enviar la bofetada.'));
        }
    }
};

export default command;
