import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['kill', 'matar', 'suicidio'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;
        const gifs = [
            'https://soblend-api.drexelxx.workers.dev/storage/ce1e6f95-12c8-4672-9ac4-7fbd234bd28e.mp4',
            'https://soblend-api.drexelxx.workers.dev/storage/5be40e0a-6f18-4600-b70a-9472fb8eba1b.mp4',
            'https://soblend-api.drexelxx.workers.dev/storage/0539b151-9679-4d4a-8faa-1428184e5107.mp4',
            'https://soblend-api.drexelxx.workers.dev/storage/b8127921-db79-40bf-8dc7-f4b6e76ce238.mp4'
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
            caption = styleText(`\`${senderName}\` mató a \`${targetName}\` (ง'̀-'́)ง`);
            mentions = [who];
        } else {
            caption = styleText(`\`${senderName}\` se suicidó... ✘_ ✘`);
        }

        await ctx.replyWithVideo(randomGif, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};

export default command;
