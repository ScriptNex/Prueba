import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['cry', 'llorar'],
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
            await bot.sock.sendMessage(chatId, { react: { text: '😭', key: msg.key } });
        } catch (e) { }

        let str: string;
        if (who !== sender) {
            str = styleText(`\`${senderName}\` está llorando por culpa de \`${targetName}\` (╥﹏╥).`);
        } else {
            str = styleText(`\`${senderName}\` está llorando (╥﹏╥).`);
        }

        const videos = [
            'https://qu.ax/gRjHK.mp4',
            'https://qu.ax/VjjCJ.mp4',
            'https://qu.ax/ltieQ.mp4',
            'https://qu.ax/oryVi.mp4',
            'https://qu.ax/YprzU.mp4',
            'https://qu.ax/nxaUW.mp4',
            'https://qu.ax/woSGV.mp4',
            'https://qu.ax/WkmA.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        await ctx.replyWithVideo(video, {
            caption: str,
            gifPlayback: true,
            mentions: [who]
        });
    }
};

export default command;
