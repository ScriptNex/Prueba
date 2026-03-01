import { downloadMediaMessage } from 'baileys';
import { UploadService } from '../../services/media/UploadService.js';
import { styleText, isOwner } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: [], // This command runs via 'before' on structured text
    tags: ['owner'],
    help: ['addwaifu'],
    before: async (ctx: CommandContext) => {
        const text = ctx.body || '';

        // Only owner can use this
        if (!isOwner(ctx.sender)) return false;

        // Regex to match the structured waifu addition form
        const regex = /❀ Nombre »\s*(.+)\s*[\n\r]+⚥ Genero »\s*(.+)\s*[\n\r]+✰ Valor »\s*(.+)\s*[\n\r]+♡ Estado »\s*(.+)\s*[\n\r]+❖ Fuente »\s*(.+)/i;
        const match = text.match(regex);

        if (!match) return false;

        const name = match[1].trim();
        const gender = match[2].trim();
        const valueStr = match[3].trim().replace(/\D/g, '');
        const value = parseInt(valueStr) || 0;
        const status = match[4].trim();
        const source = match[5].trim();

        const { gachaService, reply, msg, chatId, bot } = ctx;

        if (gachaService) {
            const existing = gachaService.getByName(name);
            if (existing) {
                await reply(styleText(
                    `⚠️ *Personaje Duplicado*\n\n` +
                    `El personaje "${name}" ya existe.\n` +
                    `ID existente: ${existing.id}\n\n` +
                    `> No se agregó el personaje.`
                ));
                return true; 
            }
        } else {
            logger.warn('GachaService not found in context for addwaifu');
        }

        let imageBuffer: Buffer | null = null;

        try {
            const message = msg.message;
            if (!message) return false;

            if (message.imageMessage) {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
            } else if (message.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = message.extendedTextMessage.contextInfo.quotedMessage;
                const fakeMsg: any = {
                    key: {
                        remoteJid: chatId,
                        id: message.extendedTextMessage.contextInfo.stanzaId,
                        participant: message.extendedTextMessage.contextInfo.participant
                    },
                    message: quoted
                };
                if (quoted.imageMessage || (quoted as any).viewOnceMessageV2?.message?.imageMessage) {
                    imageBuffer = await downloadMediaMessage(fakeMsg, 'buffer', {}) as Buffer;
                }
            } else if ((message as any).viewOnceMessageV2?.message?.imageMessage) {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
            }
        } catch (e: any) {
            logger.error('Error downloading image in addwaifu:', e);
            await reply(styleText(`❌ Error descargando imagen: ${e.message}`));
            return true;
        }

        if (!imageBuffer) {
            await reply(styleText('ꕢ Falta la imagen. Por favor adjunta una imagen o responde a una imagen con el formulario.'));
            return true;
        }

        try {
            await reply(styleText('⏳ Subiendo imagen a Soblend R2...'));

            let imageUrl: string;
            try {
                imageUrl = await UploadService.uploadToSoblendR2(imageBuffer);
                if (!imageUrl || !imageUrl.startsWith('http')) {
                    throw new Error('URL invalid from Soblend R2');
                }
            } catch (uploadError: any) {
                logger.error('Error uploading to Soblend R2:', uploadError);
                await reply(styleText(
                    `❌ *Error al subir imagen*\n\n` +
                    `No se pudo subir la imagen a Soblend R2.\n` +
                    `Error: ${uploadError.message}`
                ));
                return true;
            }

            const newCharacterData = {
                name: name,
                gender: gender,
                value: value.toString(),
                source: source,
                img: [imageUrl],
                vid: [],
                user: null,
                status: status,
                votes: 0
            };

            const addedChar = await gachaService?.addCharacter(newCharacterData);

            if (addedChar) {
                await reply(styleText(
                    `✅ *Personaje Agregado Exitosamente*\n\n` +
                    `✿ ID: ${addedChar.id}\n` +
                    `✿ Nombre: ${addedChar.name}\n` +
                    `✿ Género: ${addedChar.gender}\n` +
                    `✿ Valor: ${addedChar.value}\n` +
                    `✿ Estado: ${addedChar.status}\n` +
                    `✿ Fuente: ${addedChar.source}\n` +
                    `✿ Imagen: ${imageUrl}\n\n` +
                    `> Agregado a la base de datos global.`
                ));
            } else {
                throw new Error('Failed to add character to GachaService');
            }

        } catch (error: any) {
            logger.error('Error in addwaifu execution:', error);
            await reply(styleText(
                `❌ *Error Inesperado*\n\n` +
                `${error.message}`
            ));
        }

        return true;
    },
    async execute() {
        // Handled in 'before'
    }
};

export default command;
