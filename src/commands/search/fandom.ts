import wiki from 'wikijs';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const FANDOM_API = 'https://community.fandom.com/api.php';
const MAX_SUMMARY_LENGTH = 1500;

const command: Command = {
    commands: ['fandom', 'wikif'],
    tags: ['search'],
    help: ['fandom <término>'],
    async execute(ctx: CommandContext) {
        const { chatId, text, prefix, command: cmdName, bot, reply } = ctx;
        const conn = bot?.sock;
        if (!conn) {
            return await reply(styleText('❌ Error: Conexión no disponible.'));
        }

        try {
            if (!text || !text.trim()) {
                return await reply(styleText(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `*Ejemplos:*\n` +
                    `✿ ${prefix}${cmdName} Naruto\n` +
                    `✿ ${prefix}wikif Minecraft\n` +
                    `✿ ${prefix}fandom League of Legends`
                ));
            }

            const query = text.trim();
            const fandomWiki = (wiki as any)({ apiUrl: FANDOM_API });
            const page = await fandomWiki.page(query);

            if (!page) {
                return await reply(styleText(
                    `《✧》 No se encontró información para: "${query}"\n\n` +
                    `💡 *Tip:* Intenta con términos en inglés o verifica la ortografía.`
                ));
            }

            const [summary, images] = await Promise.all([
                page.summary().catch(() => 'Sin resumen disponible'),
                page.images().catch(() => [])
            ]);

            const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const image = (images as string[]).find(img =>
                validImageExtensions.some(ext => img.toLowerCase().endsWith(ext))
            );

            const extract = summary && summary.length > MAX_SUMMARY_LENGTH
                ? summary.slice(0, MAX_SUMMARY_LENGTH) + '...'
                : summary || 'Sin resumen disponible';

            const title = page.raw?.title || query;
            const caption = `《✧》 *Fandom Wiki*\n\n` +
                `📚 *Título:* ${title}\n\n` +
                `${extract}\n\n` +
                `─────────────────\n` +
                `_Información de Fandom_`;

            if (image) {
                await conn.sendMessage(chatId, {
                    image: { url: image },
                    caption: styleText(caption)
                });
            } else {
                await reply(styleText(caption));
            }
        } catch (error: any) {
            logger.error('[Fandom] Error en comando:', error);
            let errorMsg = `《✧》 No se encontró información para: "${text}"\n\n`;
            if (error.message && error.message.includes('page')) {
                errorMsg += `💡 *Tip:* La página no existe. Intenta con términos en inglés o verifica la ortografía.`;
            } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                errorMsg += `🌐 *Error de conexión.* Verifica tu internet e intenta de nuevo.`;
            } else {
                errorMsg += `💡 *Tip:* Intenta con términos más específicos o en inglés.`;
            }
            await reply(styleText(errorMsg));
        }
    }
};

export default command;
