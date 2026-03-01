import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['bored', 'aburrido'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, bot } = ctx;
        const videos = [
            'https://22oidna5zp.ucarecd.net/159d75e2-ebbc-4e70-ac2c-61eb27912d1d/temp_mp4_1.mp4',
            'https://22oidna5zp.ucarecd.net/52d432f9-fecb-4919-ab55-e06a293fc621/temp_mp4_2.mp4',
            'https://22oidna5zp.ucarecd.net/d3a5562b-7058-46a1-bf10-f41411719ae2/temp_mp4_3.mp4',
            'https://22oidna5zp.ucarecd.net/2b382149-fcee-4039-964c-0be12a30f83a/temp_mp4_4.mp4',
            'https://22oidna5zp.ucarecd.net/b67831d0-956d-421c-b810-3cac950812cf/temp_mp4_5.mp4',
            'https://22oidna5zp.ucarecd.net/38732d5b-4b83-4fd0-9494-7a0dba5999c0/temp_mp4_6.mp4',
            'https://22oidna5zp.ucarecd.net/4162b736-ce08-497b-b9c1-0a9e8e8fa7c1/temp_mp4_7.mp4',
            'https://22oidna5zp.ucarecd.net/60973096-e95d-48ef-874c-b844e68801d4/temp_mp4_8.mp4',
            'https://22oidna5zp.ucarecd.net/740d86b8-d082-43ee-8c35-fadcd592c287/temp_mp4_9.mp4'
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
            caption = styleText(`\`${senderName}\` está aburrido de \`${targetName}\` (っ˕ -｡)ᶻ 𝗓 𐰁`);
            mentions = [who];
        } else {
            caption = styleText(`\`${senderName}\` está muy aburrido... (っ˕ -｡)ᶻ 𝗓 𐰁`);
        }

        await ctx.replyWithVideo(randomVideo, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};

export default command;
