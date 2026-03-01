import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['cum', 'venirse', 'corrernos', 'correrse', 'leche'],
    tags: ['nsfw'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot, dbService, reply } = ctx;

        if (ctx.isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (groupData && groupData.settings && !groupData.settings.nsfw) {
                return await reply(styleText('ꕢ Los comandos NSFW están deshabilitados en este grupo.'));
            }
        }

        let who: string | null = null;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        }

        const senderName = from?.name || sender.split('@')[0];
        let str: string;

        if (who && who !== sender) {
            let targetName = await getName(bot, chatId, who);
            str = styleText(`\`${senderName}\` se vino dentro de \`${targetName}\` （´∇｀''）`);
        } else {
            str = styleText(`\`${senderName}\` se vino dentro de... Omitiremos esto.`);
        }

        try {
            const videos = [
                "https://files.catbox.moe/8rb03b.mp4",
                "https://files.catbox.moe/vwynfp.mp4",
                "https://files.catbox.moe/hipfu3.mp4"
            ];

            const url = videos[Math.floor(Math.random() * videos.length)];

            await bot.sock.sendMessage(chatId, {
                video: { url: url },
                caption: str,
                gifPlayback: true,
                mentions: who && who !== sender ? [who] : []
            }, { quoted: msg });

        } catch (e) {
            console.error('[Cum] Error:', e);
            await reply(styleText('ꕤ Error al enviar la animación NSFW.'));
        }
    }
};

export default command;
