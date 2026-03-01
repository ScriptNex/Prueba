import { loadLinks, getRandomLink, downloadMedia } from '../../utils/nsfw.js';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['himages'],
    async execute(ctx: CommandContext) {
        const { chatId, isGroup, bot, dbService, reply } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            return await reply(styleText('❌ Error: Conexión no disponible.'));
        }

        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (!groupData?.settings?.nsfw) {
                return await reply(styleText('ꕢ Los comandos NSFW están desactivados en este grupo.'));
            }
        }

        try {
            await reply(styleText('ꕢ Cargando imagen hentai...'));
            const links = await loadLinks('hentai');

            if (!links || links.length === 0) {
                return await reply(styleText('ꕢ Error al cargar la base de datos de imágenes.'));
            }

            const randomUrl = getRandomLink(links);
            const buffer = await downloadMedia(randomUrl);

            if (!buffer) {
                return await reply(styleText('ꕢ Error al descargar la imagen.'));
            }

            await conn.sendMessage(chatId, {
                image: buffer,
                caption: styleText('ꕣ Imagen hentai aleatoria')
            });
        } catch (error) {
            logger.error('[HIMAGES] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al procesar la solicitud.'));
        }
    }
};

export default command;
