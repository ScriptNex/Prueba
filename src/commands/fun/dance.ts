import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['dance', 'bailar', 'baile'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;
        const gifs = [
            'https://soblend-api.drexelxx.workers.dev/storage/cc359f94-f2d5-45d9-9c7b-c4a4e4689aa9.mp4',
            'https://soblend-api.drexelxx.workers.dev/storage/32fe3f9f-712c-48d8-ac76-974616f4698e.mp4',
            'https://soblend-api.drexelxx.workers.dev/storage/932b21ba-2372-420c-8eae-f2823dd9ace8.mp4',
            'https://soblend-api.drexelxx.workers.dev/storage/3d6218f2-14db-4cac-ab65-0eb9189b7224.mp4'
        ];

        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        let who: string | undefined;
        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        }

        const senderName = from.name || sender.split('@')[0];
        let caption = '';
        let mentions: string[] = [];

        if (who && who !== sender) {
            const targetName = await getName(bot.sock, chatId, who);
            caption = styleText(`\`${senderName}\` está bailando con \`${targetName}\` 〜⁠(⁠꒪⁠꒳⁠꒪⁠)⁠〜`);
            mentions = [who];
        } else {
            caption = styleText(`\`${senderName}\` está bailando alegrementee 〜⁠(⁠꒪⁠꒳⁠꒪⁠)⁠〜`);
        }

        await ctx.replyWithVideo(randomGif, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};

export default command;
