import { styleText } from '../../utils/helpers.js';
import { downloadMediaMessage } from 'baileys';
import { CatboxService } from '../../services/media/CatboxService.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['setnamesubbot', 'setimagesubbot', 'configbot', 'miconfig'],
    async execute(ctx: CommandContext) {
        const { tokenService, command, sender, senderPhone, args, reply, msg, bot } = ctx;
        const userId = senderPhone ? `${senderPhone}@s.whatsapp.net` : sender;
        const prembot = tokenService?.getPrembot(userId);

        if (!prembot) {
            return await reply(styleText(
                `⚠️ *Error*\n\n` +
                `> Este comando solo está disponible para Prembots.\n` +
                `> Usa *#prembot buy* para obtener uno.`
            ));
        }

        if (command === 'setnamesubbot') {
            const name = args.join(' ').trim();
            if (!name) {
                return await reply(styleText(
                    `ꕣ *Establecer Nombre del Bot*\n\n` +
                    `*Uso:* #setnamesubbot <nombre>\n\n` +
                    `*Ejemplo:*\n` +
                    `> #setnamesubbot MiBot Premium\n\n` +
                    `> _El nombre aparecerá en el menú /help_`
                ));
            }
            if (name.length > 50) {
                return await reply(styleText(`❌ El nombre es muy largo (máx. 50 caracteres)`));
            }
            const result = tokenService!.setPrembotName(userId, name);
            if (result.success) {
                return await reply(styleText(
                    `✅ *Nombre Establecido*\n\n` +
                    `> Tu bot ahora se llamará: *${name}*\n\n` +
                    `> _Usa #help para verificar el cambio_`
                ));
            } else {
                return await reply(styleText(`❌ ${result.error}`));
            }
        }

        if (command === 'setimagesubbot') {
            try {
                const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const quoted: any = quotedContent ? { message: quotedContent } : null;
                const isImage = msg.message?.imageMessage || quoted?.message?.imageMessage;

                if (!isImage) {
                    return await reply(styleText(
                        `ꕣ *Establecer Imagen del Menú*\n\n` +
                        `*Uso:*\n` +
                        `> Enviar imagen con #setimagesubbot\n` +
                        `> O citar una imagen con #setimagesubbot\n\n` +
                        `> _La imagen aparecerá en el menú /help_`
                    ));
                }

                await reply(styleText('⏳ Descargando y subiendo imagen...'));
                const messageToDownload = quoted || msg;
                const buffer = await downloadMediaMessage(
                    messageToDownload,
                    'buffer',
                    {},
                    {
                        logger: console as any,
                        reuploadRequest: bot.sock.updateMediaMessage
                    }
                );

                const url = await CatboxService.upload(buffer as Buffer);
                const result = tokenService!.setPrembotImage(userId, url);

                if (result.success) {
                    return await reply(styleText(
                        `✅ *Imagen del Menú Establecida*\n\n` +
                        `> La imagen se ha guardado correctamente.\n\n` +
                        `> URL: ${url}\n` +
                        `> _Usa #help para verificar el cambio_`
                    ));
                } else {
                    return await reply(styleText(`❌ ${result.error}`));
                }
            } catch (error: any) {
                logger.error('[Prembot Config] Error:', error);
                return await reply(styleText(`❌ Error al procesar la imagen: ${error.message}`));
            }
        }

        if (command === 'configbot' || command === 'miconfig') {
            const config = tokenService!.getPrembotConfig(userId);
            const nameDisplay = config?.customName || '(Nombre por defecto)';
            const imageDisplay = config?.customImage ? '✅ Configurada' : '❌ No configurada';

            return await reply(styleText(
                `ꕣ *Configuración de tu Prembot*\n\n` +
                `*Nombre:* ${nameDisplay}\n` +
                `*Imagen del menú:* ${imageDisplay}\n\n` +
                `*Comandos disponibles:*\n` +
                `> #setnamesubbot <nombre>\n` +
                `> #setimagesubbot (con imagen)\n\n` +
                `> _Los cambios se reflejan en #help_`
            ));
        }
    }
};

export default command;
