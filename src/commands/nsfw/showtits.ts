import { styleText, extractMentions, getRandom } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const VIDEOS = [
    'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/bz9itsx6rww.mp4',
    'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/zzhflup7inl.mp4',
    'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/48zjyu5m0cl.mp4',
    'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/lwrt2e36orf.mp4',
    'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/nmijghdmyq9.mp4'
];

const command: Command = {
    commands: ['showtits', 'st'],
    async execute(ctx: CommandContext) {
        const { chatId, isGroup, bot, sender, msg, from, dbService, reply } = ctx;

        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (!groupData?.settings?.nsfw) {
                return await reply(styleText('ꕢ Los comandos NSFW están desactivados en este grupo.'));
            }
        }

        try {
            const mentions = extractMentions(ctx);
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            let targetUser: string | null = null;

            if (mentions.length > 0) {
                targetUser = mentions[0];
            } else if (quotedParticipant) {
                targetUser = quotedParticipant;
            }

            const senderName = from?.name || msg.pushName || sender.split('@')[0];
            let caption: string;

            if (targetUser) {
                let targetName = targetUser.split('@')[0];
                if (isGroup) {
                    try {
                        const groupMetadata = await bot.sock.groupMetadata(chatId);
                        const targetId = targetUser.split('@')[0].split(':')[0];
                        const participant = groupMetadata.participants.find(p => {
                            const pId = p.id.split('@')[0].split(':')[0];
                            const pLid = p.lid ? p.lid.split('@')[0].split(':')[0] : '';
                            return pId === targetId || pLid === targetId;
                        });
                        if (participant) {
                            targetName = participant.notify || participant.name || targetId;
                        }
                    } catch (e) { }
                }
                caption = `\`${senderName}\` está mostrando las tetas a \`${targetName}\` (‿ˠ‿)`;
            } else {
                caption = `\`${senderName}\` está mostrando las tetas (‿ˠ‿)`;
            }

            const videoUrl = getRandom(VIDEOS);

            await bot.sock.sendMessage(chatId, {
                video: { url: videoUrl },
                caption: styleText(caption),
                gifPlayback: true,
                mentions: targetUser ? [sender, targetUser] : [sender]
            }, { quoted: msg });

        } catch (error) {
            logger.error('[SHOWTITS] Error:', error);
            await reply(styleText('ꕢ Error al enviar el video.'));
        }
    }
};

export default command;
