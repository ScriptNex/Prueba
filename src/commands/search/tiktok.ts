import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['tiktoksearch', 'ttss'],
    tags: ['search'],
    help: ['tiktoksearch <texto>'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, text, reply } = ctx;
        const conn = bot?.sock;

        if (!text) {
            return await reply(styleText('ꕢ Por favor escribe qué videos quieres buscar.\nEjemplo: #ttss gatos graciosos'));
        }

        try {
            const crypto = (await import('crypto')).default;
            const SECRET = 'h4rm0ny';
            const BASE_URL = 'https://harmony.drexelxx.workers.dev/v1/tiktok-search';
            const METHOD = 'GET';

            // 1. Generate Timestamp
            const timestamp = Math.floor(Date.now() / 1000);

            // 2. Generate Signature
            const urlWithQuery = `${BASE_URL}?q=${encodeURIComponent(text)}`;
            const parsedUrl = new URL(urlWithQuery);
            const pathAndQuery = parsedUrl.pathname + parsedUrl.search;
            const dataToSign = `${METHOD}:${pathAndQuery}:${timestamp}`;

            const signature = crypto.createHmac('sha256', SECRET)
                .update(dataToSign)
                .digest('hex');

            const response = await axios.get(urlWithQuery, {
                headers: {
                    'x-timestamp': String(timestamp),
                    'x-signature': signature
                }
            });

            const data = response.data;

            if (!data || !data.status || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
                return await reply(styleText('ꕢ No encontré videos para tu búsqueda.'));
            }

            const videos = data.results.slice(0, 5);

            for (const video of videos) {
                const caption = `ꕣ *TikTok Video* \n\n` +
                    `> *Título* » ${video.title}\n` +
                    `> *Autor* » ${video.author.nickname} (@${video.author.unique_id})\n` +
                    `> *Duración* » ${video.duration}s\n` +
                    `> *Vistas* » ${video.stats.play_count}\n` +
                    `> *Likes* » ${video.stats.digg_count}\n` +
                    `──────────────────\n` +
                    `> _*Powered By DeltaByte*_`;

                try {
                    const videoUrl = video.play || video.wmplay;
                    // Note: global.SafeDownloader access needs to be handled carefully in TS if not explicitly imported
                    const download = await (global as any).SafeDownloader.safeMediaDownload(videoUrl, {
                        maxSize: 50 * 1024 * 1024,
                        timeout: 120000
                    });

                    if (download.success) {
                        await conn.sendMessage(chatId, {
                            video: { url: download.filePath },
                            caption: styleText(caption)
                        });
                    } else {
                        await reply(styleText(`ꕢ Error al descargar video: ${download.error}`));
                    }
                } catch (e) {
                    logger.error('[TikTokSearch] Download error:', e);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error: any) {
            logger.error('[TikTokSearch] Error:', error);
            await reply(styleText(`ꕢ Ocurrió un error al buscar videos: ${error.message}`));
        }
    }
};

export default command;
