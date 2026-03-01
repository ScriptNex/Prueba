import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['xnxx', 'xnxxdl'],
    tags: ['nsfw', 'download'],
    help: ['xnxx <url>'],
    async execute(ctx: CommandContext) {
        const { chatId, args, prefix, command: cmdName, isGroup, dbService, reply, replyWithVideo } = ctx;

        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (!groupData.settings?.nsfw) {
                return await reply(styleText('ꕢ Los comandos NSFW están desactivados en este grupo.\n> Un admin debe activarlos con */nsfw on*'));
            }
        }

        if (!args[0]) {
            return await reply(styleText(
                `ꕢ *Uso incorrecto del comando*\n\n` +
                `Ejemplo:\n` +
                `> ${prefix}${cmdName} https://www.xnxx.com/video-example`
            ));
        }

        const url = args[0];
        if (!url.match(/xnxx/i)) {
            return await reply(styleText('ꕢ Por favor ingresa un enlace válido de XNXX.'));
        }

        try {
            await reply(styleText('ꕣ Procesando video... '));
            const response = await axios.get(`https://api.delirius.store/download/xnxxdl?url=${encodeURIComponent(url)}`);

            if (!response.data?.status || !response.data?.data) {
                return await reply(styleText('ꕢ No se pudo descargar el video. Verifica el enlace o intenta de nuevo más tarde.'));
            }

            const { title, duration, quality, views, download } = response.data.data;
            const videoUrl = download.high || download.low;

            if (!videoUrl) {
                return await reply(styleText('ꕢ No se encontró un enlace de descarga válido.'));
            }

            const caption = `ꕣ *XNXX Downloader*\n\n` +
                `> *Título* » ${title}\n` +
                `> *Duración* » ${duration || 'N/A'}\n` +
                `> *Calidad* » ${quality || 'N/A'}\n` +
                `> *Vistas* » ${views || 'N/A'}\n` +
                `> *Link* » ${url}`;

            await replyWithVideo(videoUrl, {
                caption: styleText(caption),
                fileName: `xnxx_${Date.now()}.mp4`
            });
        } catch (error) {
            logger.error('[XNXX DL] Error:', error);
            await reply(styleText('ꕢ Error al descargar el video. Inténtalo más tarde.'));
        }
    }
};

export default command;
