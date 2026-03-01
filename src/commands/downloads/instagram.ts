import { igdl } from 'ruhend-scraper';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['instagram', 'ig', 'igdl'],
    async execute(ctx: CommandContext) {
        try {
            if (ctx.args.length === 0) {
                return await ctx.reply(styleText(`ꕢ *Uso incorrecto del comando*\n\nEjemplo:\n> #instagram https://www.instagram.com/p/xxxxx\n> #ig https://www.instagram.com/reel/xxxxx`));
            }

            const globalAny = global as any;
            const memCheck = globalAny.memoryManager?.canProcessDownload();
            if (memCheck && !memCheck.allowed) return await ctx.reply(styleText(memCheck.message));
            
            const url = ctx.args[0];
            if (!url.includes('instagram.com')) return await ctx.reply(styleText('ꕢ Por favor ingresa un link válido de Instagram.'));
            
            await ctx.reply(styleText('Descargando...'));
            
            const response = await igdl(url);
            if (!response.data || response.data.length === 0) {
                return await ctx.reply(styleText('ꕢ No se encontró contenido en este enlace.\n\n> *Tip:* Verifica que el enlace sea correcto y público.'));
            }
            
            const media = response.data.sort((a: any, b: any) => parseInt(b.resolution || '0') - parseInt(a.resolution || '0'))[0];
            if (!media || !media.url) throw new Error('No se encontró un medio válido.');
            
            await (ctx as any).replyWithVideo(media.url, { 
                caption: styleText(`ꕣ *Instagram Downloader*\n\n> ✿ *Resolución* » ${media.resolution || 'Desconocida'}\n> ✿ *Link original* » ${url}`) 
            });
        } catch (error: any) {
            console.error('Error en comando instagram:', error);
            const globalAny = global as any;
            if (error.code === 'ENOSPC' || error.message?.includes('ENOSPC')) {
                globalAny.memoryManager?.forceCleanup();
                return await ctx.reply(styleText('ꕢ Error de espacio/memoria. Intenta en unos segundos.'));
            }
            await ctx.reply(styleText(`ꕢ Error al descargar contenido de Instagram.`));
        }
    }
};

export default command;
