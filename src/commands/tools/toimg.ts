import { downloadMediaMessage } from 'baileys';
import sharp from 'sharp';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['toimg', 'img'],
    tags: ['tools'],
    help: ['toimg (respondiendo a un sticker)'],
    async execute(ctx: CommandContext) {
        const { msg, bot, chatId, reply } = ctx;
        const msgAny: any = msg;

        try {
            const quotedContent = msgAny.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quoted = quotedContent ? { message: quotedContent } : null;

            const isSticker = quoted?.message?.stickerMessage;

            if (!isSticker) {
                return await reply(styleText('ꕢ Debes responder a un sticker con este comando.'));
            }

            const buffer = await downloadMediaMessage(
                quoted as any,
                'buffer',
                {},
                { 
                    logger: console as any, 
                    reuploadRequest: bot?.sock.updateMediaMessage 
                }
            ) as Buffer;

            const imageBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            await bot?.sock.sendMessage(chatId, { image: imageBuffer }, { quoted: msg as any });

        } catch (error: any) {
            console.error('Error convirtiendo sticker a imagen:', error);
            await reply(styleText(`ꕢ Error al convertir el sticker: ${error.message}`));
        }
    }
};

export default command;
