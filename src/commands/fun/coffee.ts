import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['coffee', 'cafe'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;
        const videos = [
            'https://22oidna5zp.ucarecd.net/5b3974a7-8aa8-4e74-a374-9a7f18db1ce2/coffee_1.mp4',
            'https://22oidna5zp.ucarecd.net/0a2cb283-33bc-4d93-bb24-e41fc74d8ece/coffee_2.mp4',
            'https://22oidna5zp.ucarecd.net/2f89d9de-a6c6-4c83-9007-d501e782b0b8/coffee_3.mp4',
            'https://22oidna5zp.ucarecd.net/7f0735e9-8778-480f-a8a3-72019797c904/coffee_4.mp4',
            'https://22oidna5zp.ucarecd.net/3fd96d9c-2cce-431a-8a59-253a8cd8710e/coffee_5.mp4',
            'https://22oidna5zp.ucarecd.net/b197d225-4f0f-4199-a3a5-e23b5eb5dca4/coffee_6.mp4',
            'https://22oidna5zp.ucarecd.net/e0045afb-8131-4155-ae0b-e543d9f505d5/coffee_7.mp4',
            'https://22oidna5zp.ucarecd.net/95d7d07a-ff1a-497a-9127-06bfc31f2ea9/coffee_8.mp4',
            'https://22oidna5zp.ucarecd.net/9bad9ab3-594d-4b13-83cd-0395e6d64538/coffee_9.mp4',
            'https://22oidna5zp.ucarecd.net/0dfdcdd9-64cc-4327-beea-68328b68806e/coffee_10.mp4',
            'https://22oidna5zp.ucarecd.net/5b959734-4a81-47e1-85af-9b5373c33876/coffee_11.mp4',
            'https://22oidna5zp.ucarecd.net/0b4ceae3-d3cd-4c15-9266-03553cc9541e/coffee_12.mp4'
        ];

        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
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
            caption = styleText(`\`${senderName}\` está tomando café con \`${targetName}\` (っ˘ڡ˘ς)`);
            mentions = [who];
        } else {
            caption = styleText(`\`${senderName}\` está disfrutando de un café (っ˘ڡ˘ς)`);
        }

        await ctx.replyWithVideo(randomVideo, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};

export default command;
