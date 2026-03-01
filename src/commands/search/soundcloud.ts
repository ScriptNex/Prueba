import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const SEARCH_API = 'https://api.delirius.store/search/soundcloud';
const DOWNLOAD_API = 'https://api.delirius.store/download/soundcloud';
const SESSION_TIMEOUT = 5 * 60 * 1000;

const scStore = new Map<string, any[]>();

async function scSearch(query: string) {
    try {
        const res = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(query)}&limit=5`);
        return res.data?.data || [];
    } catch (err: any) {
        logger.error('Error searching:', err.message);
        throw new Error('No se pudo realizar la búsqueda');
    }
}

async function scDownload(url: string) {
    try {
        const encoded = encodeURIComponent(url);
        const res = await axios.get(`${DOWNLOAD_API}?url=${encoded}`);
        return res.data?.data || null;
    } catch (err: any) {
        logger.error('Error downloading:', err.message);
        throw new Error('No se pudo descargar el audio');
    }
}

async function sendSoundCloud(ctx: CommandContext, url: string) {
    const { bot, chatId, msg, reply } = ctx;
    const conn = bot?.sock;
    if (!conn) {
        throw new Error('Conexión no disponible');
    }
    try {
        const data = await scDownload(url);
        if (!data || !data.download) { return await reply(styleText('⚠️ Error al obtener el enlace de audio.')) }
        const title = data.title || 'Desconocido'
        const author = data.author || 'Artista desconocido'
        const link = data.link || url
        const caption = `🎵 *${title}*\n👤 ${author}\n🔗 ${link}`
        const thumb = data.image || data.author_avatar;

        if (thumb) {
            try {
                await conn.sendMessage(chatId, {
                    image: { url: thumb },
                    caption: styleText(caption)
                });
            } catch (imgErr) {
                logger.error('Error enviando imagen:', imgErr);
                await reply(styleText(caption))
            }
        } else {
            await reply(styleText(caption));
        }

        await conn.sendMessage(
            chatId,
            {
                document: { url: data.download },
                mimetype: 'audio/mpeg',
                fileName: `${title.replace(/[/\\?%*:|"<>]/g, '_')}.mp3`,
                caption: ''
            },
            { quoted: msg }
        );
    } catch (err) {
        logger.error('Error sending audio:', err);
        throw err;
    }
}

const command: Command = {
    commands: ['soundcloud', 'scsearch'],
    tags: ['search'],
    help: ['soundcloud <texto>'],
    async execute(ctx: CommandContext) {
        const { text, prefix, command: cmdName, sender, reply } = ctx
        try {
            if (!text) {
                return await reply(styleText(
                    `📻 *Ejemplo:* ${prefix}${cmdName} ncs\n\nPara buscar canciones en SoundCloud.`
                ));
            }
            const result = await scSearch(text)
            if (!result || result.length === 0) { return await reply(styleText('❌ No se encontraron resultados.')) }
            
            if (result.length === 1) {
                const song = result[0];
                await sendSoundCloud(ctx, song.link);
                return;
            }
            
            const list = result
                .map((v: any, i: number) => {
                    const title = v.title || 'Sin título';
                    const artist = v.artist || 'Artista desconocido';
                    const link = v.link || '';
                    return `*${i + 1}.* 🎵 ${title}\n👤 ${artist}\n🔗 ${link}`;
                })
                .join('\n\n');
            
            await reply(styleText(
                `🎧 *Resultados de SoundCloud:*\n\n${list}\n\n` +
                `Escribe el número *1 - ${result.length}* para descargar.`
            ));
            
            scStore.set(sender, result);
            setTimeout(() => {
                if (scStore.has(sender)) {
                    scStore.delete(sender)
                }
            }, SESSION_TIMEOUT)
        } catch (err: any) {
            logger.error('Error en execute:', err);
            await reply(styleText('⚠️ Ocurrió un error al buscar: ' + err.message));
        }
    },
    async before(ctx: CommandContext) {
        try {
            const { text, sender, reply } = ctx
            if (!text || !scStore.has(sender)) { return false }
            
            const results = scStore.get(sender)!;
            const num = parseInt(text.trim());
            
            if (isNaN(num) || num < 1 || num > results.length) { return false }
            
            const song = results[num - 1];
            scStore.delete(sender);
            
            try {
                await sendSoundCloud(ctx, song.link);
            } catch (err) {
                logger.error('Error enviando audio:', err);
                await reply(styleText('❌ Error al enviar el archivo de audio.'));
            }
            return true
        } catch (err) {
            logger.error('Error in soundcloud before:', err);
            return false;
        }
    }
};

export default command;
