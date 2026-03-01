import axios from 'axios';
import https from 'https';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

async function ytMp3(url: string) {
    try {
        const { data } = await axios.get(`https://kawpapi.vercel.app/api/download?query=${encodeURIComponent(url)}&format=mp3`);
        if (data && data.download_url) {
            return { 
                media: { audio: data.download_url }, 
                title: data.title || 'Audio', 
                author: { name: data.author || 'Desconocido' }, 
                duration: data.duration || '', 
                cover: data.thumbnail || '' 
            };
        }
        throw new Error("No se encontró el enlace de descarga.");
    } catch (error: any) {
        console.error('[DEBUG] YTMP3 Error:', error.message);
        throw new Error(error.message || "Error al procesar MP3");
    }
}

const command: Command = {
    commands: ['ytmp3', 'yta', 'audio'],
    tags: ['download'],
    help: ['ytmp3 <url>'],
    async execute(ctx: CommandContext) {
        if (!ctx.args[0]) {
            return await ctx.reply(styleText(`ꕢ Por favor proporciona un enlace de YouTube.\n\n*Ejemplo:*\n${ctx.prefix}ytmp3 https://www.youtube.com/watch?v=example`));
        }
        
        if (!/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/.test(ctx.args[0])) {
            return await ctx.reply(styleText(`ꕢ La URL proporcionada no es válida.`));
        }

        await ctx.reply(styleText('ꕣ Procesando tu audio, por favor espera...'));
        
        try {
            const info = await ytMp3(ctx.args[0]);
            if (info && info.media && info.media.audio) {
                await ctx.reply(styleText('⏳ Descargando audio...'));
                
                const audioStream = await axios({ 
                    url: info.media.audio, 
                    method: 'GET', 
                    responseType: 'stream', 
                    timeout: 60000, 
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, 
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }) 
                });
                
                const caption = styleText(`⋆.˚*YOUTUBE AUDIO*\n\n> Título » ${info.title}\n> Canal » ${info.author?.name || 'Desconocido'}\n> Duración » ${info.duration || 'N/A'}`);
                
                await ctx.bot.sendMessage(ctx.chatId, { 
                    audio: { stream: audioStream.data }, 
                    mimetype: 'audio/mpeg', 
                    fileName: `${info.title.replace(/[\/\\:*?"<>|]/g, '_')}.mp3`, 
                    contextInfo: { 
                        externalAdReply: { 
                            title: info.title, 
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
            console.error('YTMP3 Plugin Error:', error);
            await ctx.reply(styleText('ꕢ Error al descargar el audio. Intenta de nuevo más tarde.'));
        }
    }
};

export default command;
