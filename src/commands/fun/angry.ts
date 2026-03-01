import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['angry', 'enojado', 'molesto', 'furioso'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;
        const videos = [
            'https://22oidna5zp.ucarecd.net/49979857-f59f-4577-af28-180f6cacdc64/ezgif80c70f7860fccf12.mp4',
            'https://22oidna5zp.ucarecd.net/21c8efb1-2cfd-4e80-b7c6-83b99443258c/ezgif8a3c1c48a4d7d3c5.mp4',
            'https://22oidna5zp.ucarecd.net/21c8efb1-2cfd-4e80-b7c6-83b99443258c/ezgif8a3c1c48a4d7d3c5.mp4',
            'https://22oidna5zp.ucarecd.net/d29e40b2-e544-4a58-b195-2d13a0964d3c/ezgif8ec01aba325b9b75.mp4',
            'https://22oidna5zp.ucarecd.net/27b47622-fe4d-42ab-89fb-dd0d2a64c3fd/ezgif859264e4ec9e9fec.mp4',
            'https://22oidna5zp.ucarecd.net/7afcf671-d9d2-44da-a44f-bef1683e8fe6/ezgif8aad43d5d8f1aa3c.mp4',
            'https://22oidna5zp.ucarecd.net/8594d839-6f37-4853-b14f-61fe1dc85f30/ezgif816cbbfbb1ee575a.mp4',
            'https://22oidna5zp.ucarecd.net/75ee8462-5a7f-4bb4-a127-1839c1f65ae7/ezgif87800dbde3aec1c7.mp4',
            'https://22oidna5zp.ucarecd.net/d12796f7-5cba-4321-950c-66abbc0f3420/ezgif83d28e5d17a2195a.mp4',
            'https://22oidna5zp.ucarecd.net/b0cddd6a-6daf-4b8f-b73e-42387813cd30/ezgif8c2605734b50c868.mp4'
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
            caption = styleText(`\`${senderName}\` está muy enojado con \`${targetName}\` (¬\`‸´¬)`);
            mentions = [who];
        } else {
            caption = styleText(`\`${senderName}\` está furioso (¬\`‸´¬)`);
        }

        await ctx.replyWithVideo(randomVideo, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};

export default command;
