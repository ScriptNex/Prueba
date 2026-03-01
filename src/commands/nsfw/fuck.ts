import { extractMentions, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['fuck', 'coger'],
    tags: ['nsfw'],
    async execute(ctx: CommandContext) {
        const { msg, sender, from, chatId, isGroup, dbService, reply, bot, replyWithVideo } = ctx;
        
        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (!groupData.settings?.nsfw) {
                return await reply(styleText('ꕢ Los comandos NSFW están desactivados en este grupo.\n> Un admin debe activarlos con */nsfw on*'));
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

        const senderName = from?.name || msg.pushName || sender.split('@')[0];
        const videos = [
            "https://files.catbox.moe/ta67ym.mp4",
            "https://files.catbox.moe/n1ozh5.mp4",
            "https://files.catbox.moe/txg7gt.mp4",
            "https://files.catbox.moe/xhvfa5.mp4",
            "https://files.catbox.moe/4ua8f3.mp4",
            "https://files.catbox.moe/wbbhne.mp4",
            "https://files.catbox.moe/4fx6pj.mp4",
            "https://files.catbox.moe/jyjvod.mp4",
            "https://files.catbox.moe/qw0sh3.mp4",
            "https://files.catbox.moe/x6q2nn.mp4"
        ];
        const video = videos[Math.floor(Math.random() * videos.length)];
        
        let str: string;
        if (who && who !== sender) {
            let targetName = who.split('@')[0].split(':')[0];
            try {
                if (isGroup) {
                    const groupMetadata = await bot.sock.groupMetadata(chatId);
                    const whoId = targetName;
                    const participant = groupMetadata.participants.find(p => {
                        const pId = p.id.split('@')[0].split(':')[0];
                        const pLid = p.lid ? p.lid.split('@')[0].split(':')[0] : '';
                        return pId === whoId || pLid === whoId;
                    });
                    if (participant) {
                        targetName = participant.notify || participant.name || whoId;
                    }
                }
            } catch (e) { }
            str = styleText(`\`${senderName}\` está cogiendo con \`${targetName}\` ( ⸝⸝´꒳\`⸝⸝)`);
        } else {
            str = styleText(`\`${senderName}\` esta cogiendo ( ⸝⸝´꒳\`⸝⸝)`);
        }

        await replyWithVideo(video, {
            caption: str,
            gifPlayback: true,
            mentions: who ? [who] : []
        });
    }
};

export default command;
