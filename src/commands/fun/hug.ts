import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['hug', 'abrazar'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;

        let target: string;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length) target = mentioned[0];
        else if (quoted) target = quoted;
        else target = sender;

        const senderName = from.name || sender.split('@')[0];
        const targetName = await getName(bot.sock, chatId, target);

        try {
            await bot.sock.sendMessage(chatId, {
                react: { text: '🫂', key: msg.key }
            });
        } catch { }

        let text: string;
        if (target !== sender) {
            text = styleText(`\`${senderName}\` le dio un fuerte abrazo a \`${targetName}\`.`);
        } else {
            text = styleText(`\`${senderName}\` se abrazó a sí mismo.`);
        }

        const videos = [
            'https://telegra.ph/file/6a3aa01fabb95e3558eec.mp4',
            'https://telegra.ph/file/0e5b24907be34da0cbe84.mp4',
            'https://telegra.ph/file/6bc3cd10684f036e541ed.mp4',
            'https://telegra.ph/file/3e443a3363a90906220d8.mp4',
            'https://telegra.ph/file/56d886660696365f9696b.mp4',
            'https://telegra.ph/file/3eeadd9d69653803b33c6.mp4',
            'https://telegra.ph/file/436624e53c5f041bfd597.mp4',
            'https://telegra.ph/file/5866f0929bf0c8fe6a909.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        await ctx.replyWithVideo(video, {
            caption: text,
            gifPlayback: true,
            mentions: [target]
        });
    }
};

export default command;
