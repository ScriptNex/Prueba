import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['sleep', 'dormir'],
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
            targetName = senderName;
        } else {
            targetName = await getName(bot.sock, chatId, who);
        }

        try {
            await bot.sock.sendMessage(chatId, { react: { text: '😴', key: msg.key } });
        } catch (e) { }

        let str: string;
        if (who !== sender) {
            str = styleText(`\`${senderName}\` esta durmiendo con \`${targetName}\` (ᴗ˳ᴗ)ᶻ𝗓𐰁`)
        } else {
            str = styleText(`\`${senderName}\` está tomando una siesta (ᴗ˳ᴗ)ᶻ𝗓𐰁`);
        }

        const videos = [
            'https://telegra.ph/file/0684477ff198a678d4821.mp4',
            'https://telegra.ph/file/583b7a7322fd6722751b5.mp4',
            'https://telegra.ph/file/e6ff46f4796c57f2235bd.mp4',
            'https://telegra.ph/file/06b4469cd5974cf4e28ff.mp4',
            'https://telegra.ph/file/9213f74b91f8a96c43922.mp4',
            'https://telegra.ph/file/b93da0c01981f17c05858.mp4',
            'https://telegra.ph/file/8e0b0fe1d653d6956608a.mp4',
            'https://telegra.ph/file/3b091f28e5f52bc774449.mp4',
            'https://telegra.ph/file/7c795529b38d1a93395f6.mp4',
            'https://telegra.ph/file/6b8e6cc26de052d4018ba.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        await bot.sock.sendMessage(chatId, {
            video: { url: video },
            caption: str,
            gifPlayback: true,
            mentions: [who]
        }, { quoted: msg });
    }
};

export default command;
