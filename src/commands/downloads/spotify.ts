import axios from "axios";
import fs from "fs";
import path from "path";
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

async function searchSong(query: string) {
    // Note: The original used ‘fetch’ but typed as ‘node-fetch’. 
    // I'll use axios for consistency and better error handling.
    const res = await axios({
        method: "POST",
        url: `https://spotdown.org/api/song-details?url=${encodeURIComponent(query)}`,
        headers: { "Accept": "application/json, text/plain, */*", "Content-Type": "application/json" },
        data: { url: query },
        responseType: 'stream'
    });
    
    if (res.status !== 200) throw new Error("Error en la descarga de Spotify");
    
    const fileName = `spotify_${Date.now()}.mp3`;
    const outputPath = path.resolve('./tmp', fileName);
    const fileStream = fs.createWriteStream(outputPath);
    
    await new Promise((resolve, reject) => {
        res.data.pipe(fileStream);
        res.data.on("error", reject);
        fileStream.on("finish", () => resolve(undefined));
    });
    
    return { url: outputPath, title: 'Unknown', artist: 'Unknown', duration: 'N/A' };
}

const command: Command = {
    commands: ['sp', 'spotifydl', 'spot'],
    tags: ['download'],
    help: ['sp <url|canción>'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, args, reply } = ctx;
        const query = args.join(' ');
        if (!query) return await reply(styleText('ꕢ Ingresa el link o nombre de la canción.'));
        
        try {
            const song = await searchSong(query);
            const caption = styleText(`*SPOTIFY DOWNLOAD* \n\n> ᰔᩚ Título » ${song.title}\n> ❀ Artista » ${song.artist}\n> ⚝ Duración » ${song.duration || 'N/A'}\n\n> ⤷ ゛Powered By DeltaByteˎˊ˗`);
            
            await bot.sock.sendMessage(chatId, { 
                audio: { url: song.url }, 
                mimetype: 'audio/mpeg', 
                fileName: `${song.title}.mp3`, 
                caption: caption 
            }, { quoted: ctx.msg });
            
            if (fs.existsSync(song.url)) fs.unlinkSync(song.url);
        } catch (error: any) {
            console.error('[Spotify] Error:', error);
            await reply(styleText(`ꕢ Error: ${error.message}`));
        }
    }
};

export default command;
