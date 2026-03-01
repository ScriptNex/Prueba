import fetch from 'node-fetch';
import FormData from 'form-data';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['upload', 'subir'],
    async execute(ctx: CommandContext) {
        const { msg, reply } = ctx;
        const msgAny: any = msg;

        const quotedContent = msgAny.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quoted = quotedContent ? { message: quotedContent } : null;
        
        const isImage = msgAny.message?.imageMessage;
        const isQuotedImage = quoted?.message?.imageMessage;
        const isVideo = msgAny.message?.videoMessage;
        const isQuotedVideo = quoted?.message?.videoMessage;
        const isDocument = msgAny.message?.documentMessage;
        const isQuotedDocument = quoted?.message?.documentMessage;
        const isAudio = msgAny.message?.audioMessage;
        const isQuotedAudio = quoted?.message?.audioMessage;
        const isSticker = msgAny.message?.stickerMessage;
        const isQuotedSticker = quoted?.message?.stickerMessage;

        const hasMedia = isImage || isQuotedImage || isVideo || isQuotedVideo ||
            isDocument || isQuotedDocument || isAudio || isQuotedAudio ||
            isSticker || isQuotedSticker;

        if (!hasMedia) {
            return await reply(styleText(
                `ꕢ *UPLOAD - Subir Archivos*\n\n` +
                `> Responde a un archivo con #upload\n` +
                `> O envía un archivo con el comando.\n\n` +
                `> Soporta: Imágenes`
            ));
        }

        await reply(styleText('ꕢ Subiendo archivo...'));

        try {
            const buffer = await downloadMediaMessage(
                (quoted ? quoted : msg) as any,
                'buffer',
                {}
            ) as Buffer;

            if (!buffer) {
                return await reply(styleText('ꕢ Error al descargar el archivo.'));
            }

            let filename = 'file';
            let mimetype = 'application/octet-stream';

            if (isImage || isQuotedImage) {
                const imageMsg = isImage || isQuotedImage;
                mimetype = imageMsg.mimetype || 'image/jpeg';
                filename = `image.${mimetype.split('/')[1] || 'jpg'}`;
            } else if (isVideo || isQuotedVideo) {
                const videoMsg = isVideo || isQuotedVideo;
                mimetype = videoMsg.mimetype || 'video/mp4';
                filename = `video.${mimetype.split('/')[1] || 'mp4'}`;
            } else if (isDocument || isQuotedDocument) {
                const docMsg = isDocument || isQuotedDocument;
                mimetype = docMsg.mimetype || 'application/octet-stream';
                filename = docMsg.fileName || `document.${mimetype.split('/')[1] || 'bin'}`;
            } else if (isAudio || isQuotedAudio) {
                const audioMsg = isAudio || isQuotedAudio;
                mimetype = audioMsg.mimetype || 'audio/mpeg';
                filename = `audio.${audioMsg.ptt ? 'ogg' : 'mp3'}`;
            } else if (isSticker || isQuotedSticker) {
                const stickerMsg = isSticker || isQuotedSticker;
                mimetype = stickerMsg.mimetype || 'image/webp';
                filename = 'sticker.webp';
            }

            const formData = new FormData();
            formData.append('file', buffer, {
                filename: filename,
                contentType: mimetype
            });

            const response = await fetch('https://soblend-api.drexelxx.workers.dev/api/upload', {
                method: 'POST',
                body: formData as any
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result: any = await response.json();
            const fileUrl = result.url || result.link || result.file || result.data?.url || result.data?.link;

            if (!fileUrl) {
                throw new Error('No se recibió un link válido del servidor');
            }

            await reply(styleText(
                `ꕣ *Archivo subido exitosamente*\n\n` +
                `> Archivo » ${filename}\n` +
                `> Link » ${fileUrl}\n\n` +
                `> El archivo estará disponible en línea`
            ));
        } catch (error: any) {
            logger.error('Error uploading file:', error);
            await reply(styleText(`ꕢ Error al subir: ${error.message}`));
        }
    }
};

export default command;
