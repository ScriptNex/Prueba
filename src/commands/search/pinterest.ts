import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const API_URL = 'https://pinscrapper.vercel.app/api/pinterest/search';
const REQUEST_TIMEOUT = 20000;
const IMAGE_DELAY = 1000;
const DEFAULT_LIMIT = 7;

const command: Command = {
    commands: ['pinterest', 'pin', 'pinsearch'],
    tags: ['search'],
    help: ['pinterest <texto de búsqueda>'],
    async execute(ctx: CommandContext) {
        const { chatId, bot, prefix, command: cmdName, text, reply } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            return await reply(styleText('❌ Error: Conexión no disponible.'));
        }

        try {
            if (!text || !text.trim()) {
                return await reply(styleText(
                    `ꕢ *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `> ${prefix}${cmdName} gatos\n` +
                    `> ${prefix}pin aesthetic wallpaper\n` +
                    `> ${prefix}pin naturaleza`
                ));
            }
            const searchQuery = text.trim();
            const apiUrl = `${API_URL}?q=${encodeURIComponent(searchQuery)}&limit=${DEFAULT_LIMIT}`;

            const response = await axios.get(apiUrl, {
                timeout: REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const data = response.data;
            if (!data || !data.success || !data.images || !Array.isArray(data.images) || data.images.length === 0) {
                return await reply(styleText(
                    'ꕢ No se encontraron imágenes para tu búsqueda.\n\n' +
                    '> *Tip* » Intenta con otras palabras clave.'
                ));
            }

            const images = data.images;
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                if (!image || !image.imageUrl) {
                    logger.error(`[Pinterest] Imagen ${i + 1} sin URL válida`);
                    continue;
                }
                try {
                    const caption = `《✧》 *Pinterest* 📌\n` +
                        `> *Título:* ${image.title || 'Sin título'}\n` +
                        `_Imagen ${i + 1} de ${images.length}_`;
                    await conn.sendMessage(chatId, {
                        image: { url: image.imageUrl },
                        caption: styleText(caption)
                    })
                    if (i < images.length - 1) { await new Promise(resolve => setTimeout(resolve, IMAGE_DELAY)) }
                } catch (sendError: any) {
                    logger.error(`[Pinterest] Error enviando imagen ${i + 1}:`, sendError.message);
                }
            }
        } catch (error: any) {
            logger.error('[Pinterest] Error en comando:', error);
            let errorMsg = '《✧》 Error al buscar imágenes en Pinterest.'
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMsg += '\n\n⏱️ La solicitud tardó demasiado. Intenta de nuevo.';
            } else if (error.response) {
                errorMsg += `\n\n❌ Error del servidor: ${error.response.status}`;
            } else if (error.request) {
                errorMsg += '\n\n🌐 Sin respuesta del servidor. Verifica tu conexión.';
            } else {
                errorMsg += `\n\n💡 *Tip:* Intenta con términos más específicos.`;
            }
            await reply(styleText(errorMsg));
        }
    }
};

export default command;
