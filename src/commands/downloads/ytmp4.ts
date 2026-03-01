import axios from 'axios';
import https from 'https';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

async function ytMp4(url: string) {
    try {
        const { data } = await axios.get(`https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=mp4&quality=120&apikey=may-4363eca0`);
        if (data && data.status && data.result && data.result.url) {
            return { 
                url: data.result.url, 
                title: data.result.title || 'Video', 
                author: { name: 'YouTube' }, 
                duration: '', 
                cover: '', 
                quality: data.result.quality || '720P' 
            };
        }
        throw new Error("No se encontró el enlace de descarga.");
    } catch (error: any) {
        console.error('[DEBUG] YTMP4 Error:', error.message);
        throw new Error(error.message || "Error al procesar MP4");
    }
}

const command: Command = {
    commands: ['ytmp4', 'ytv', 'video'],
    tags: ['download'],
    help: ['ytmp4 <url>'],
    async execute(ctx: CommandContext) {
        if (!ctx.args[0]) {
            return await ctx.reply(styleText(`ꕢ Por favor proporciona un enlace de YouTube.\n\n*Ejemplo:*\n${ctx.prefix}ytmp4 https://www.youtube.com/watch?v=example`));
        }
        
        if (!/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/.test(ctx.args[0])) {
            return await ctx.reply(styleText(`ꕢ La URL proporcionada no es válida.`));
        }

        await ctx.reply(styleText('ꕣ Procesando tu video, por favor espera...'));
        
        try {
            const info = await ytMp4(ctx.args[0]);
            const videoUrl = info?.url;
            
            if (videoUrl) {
                const caption = styleText(`⋆.˚*YOUTUBE VIDEO*\n\n> Título » ${info.title || 'Desconocido'}\n> Canal » ${info.author?.name || 'YouTube'}\n> Duración » ${info.duration || 'N/A'}`);
                
                const videoStream = await axios({ 
                    url: videoUrl, 
                    method: 'GET', 
                    responseType: 'stream', 
                    timeout: 60000, 
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, 
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }) 
                });
                
                await ctx.bot.sendMessage(ctx.chatId, { 
                    video: { stream: videoStream.data }, 
                    caption: caption, 
                    mimetype: 'video/mp4', 
                    fileName: `${(info.title || 'video').replace(/[\/\\:*?"<>|]/g, '_').substring(0, 50)}.mp4`, 
                    contextInfo: { 
                        externalAdReply: { 
                            title: info.title || 'Video', 
                            body: info.author?.name || 'YouTube', 
                            thumbnailUrl: info.cover || '', 
                            sourceUrl: ctx.args[0], 
                            mediaType: 1, 
                            renderLargerThumbnail: true 
                        } 
                    } 
                }, { quoted: ctx.msg });
            } else throw new Error('No se pudo obtener el enlace de descarga.');
        } catch (error) {
            console.error('YTMP4 Plugin Error:', error);
            await ctx.reply(styleText('ꕢ Error al descargar el video. Intenta de nuevo más tarde.'));
        }
    }
};

export default command;
