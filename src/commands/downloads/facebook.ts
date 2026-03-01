import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const fbvdl = async (urlFesnuk: string) => {
    if (typeof urlFesnuk !== "string") throw Error(`Link inválido`);
    const r = await fetch("https://fdown.net/download.php", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ URLz: urlFesnuk })
    });
    if (!r.ok) throw Error(`Error al conectar con el servidor de descarga`);
    const html = await r.text();
    const hd = html.match(/id="hdlink" href="(.+?)" download/)?.[1]?.replaceAll("&amp;", "&");
    const sd = html.match(/id="sdlink" href="(.+?)" download/)?.[1]?.replaceAll("&amp;", "&");
    if (!hd && !sd) throw Error(`No se encontró video descargable. Asegúrate de que sea público.`);
    return { hd, sd };
};

const command: Command = {
    commands: ['facebook', 'fb', 'fbdl'],
    tags: ['download'],
    help: ['facebook <url>'],
    async execute(ctx: CommandContext) {
        const { args, reply } = ctx;
        if (args.length === 0) {
            return await reply(styleText(`ꕢ *Uso incorrecto del comando*\n\nEjemplo:\n> #facebook https://www.facebook.com/watch?v=xxxxx\n> #fb https://fb.watch/xxxxx`));
        }
        
        const url = args[0];
        if (!url.match(/(facebook\.com|fb\.watch)/i)) {
            return await reply(styleText('ꕢ Por favor ingresa un link válido de Facebook.'));
        }

        await reply(styleText('ꕣ Procesando tu video...'));
        
        try {
            const { hd, sd } = await fbvdl(url);
            await (ctx as any).replyWithVideo(hd || sd, { 
                caption: styleText(`ꕣ *Facebook Downloader*\n\n> ✿ *Calidad* » ${hd ? 'HD' : 'SD'}\n> ✿ *Link original* » ${url}`), 
                fileName: 'facebook_video.mp4' 
            });
        } catch (error: any) {
            console.error('Error en comando facebook:', error);
            await reply(styleText(`ꕢ Error: ${error.message}`));
        }
    }
};

export default command;
