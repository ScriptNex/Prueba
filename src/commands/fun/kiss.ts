import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';
import axios from 'axios';

const command: Command = {
    commands: ['kiss', 'skiss', 'kis', 'besos', 'beso', 'besar', 'besando'],
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
            const res = await axios.get('https://nekos.life/api/kiss');
            const { url } = res.data;

            const str = styleText(`\`${senderName}\` está besando a \`${targetName}\``);

            await bot.sock.sendMessage(chatId, {
                image: { url: url },
                caption: str,
                mentions: [who]
            }, { quoted: msg });

        } catch (e) {
            console.error('[Kiss] Error:', e);
            await ctx.reply(styleText('ꕤ Error al obtener el beso.'));
        }
    }
};

export default command;
