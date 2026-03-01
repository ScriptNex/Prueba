import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['sticker', 's'],
    async execute(ctx: CommandContext) {
        const { msg, bot, chatId, args, reply } = ctx;
        const msgAny: any = msg;

        try {
            const quotedContent = msgAny.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quoted = quotedContent ? { message: quotedContent } : null;
            const isImage = msgAny.message?.imageMessage || quoted?.message?.imageMessage;
            const isVideo = msgAny.message?.videoMessage || quoted?.message?.videoMessage;
            
            if (!isImage && !isVideo) {
                return await reply(styleText('ꕢ Debes enviar una imagen o video, o responder a uno.'));
            }
            
            const messageToDownload: any = quoted || msg;
            const [buffer, pushName, description] = await Promise.all([
                downloadMediaMessage(
                    messageToDownload,
                    'buffer',
                    {},
                    { logger: console as any, reuploadRequest: bot?.sock.updateMediaMessage }
                ) as Promise<Buffer>,
                Promise.resolve(msgAny.pushName || 'Usuario'),
                Promise.resolve(args?.length > 0 ? args.join(' ') : null)
            ]);

            const packName = `${pushName} • ༘⋆✿ Alya Kujou\n     ⤷ ゛Soblend | soblend.vercel.appˎˊ˗`;
            const authorName = description
                ? `> ⊹Description ࣪ ˖  »\n${description}`
                : '';
                
            const sticker = new Sticker(buffer, {
                pack: packName,
                author: authorName,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'] as any,
                id: '12345',
                quality: 30,
                background: 'transparent'
            });
            
            const stickerBuffer = await sticker.toBuffer();
            await bot?.sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg as any });
        } catch (error: any) {
            console.error('Error creando sticker:', error);
            await reply(styleText(`ꕢ Error al crear el sticker: ${error.message}`));
        }
    }
};

export default command;
