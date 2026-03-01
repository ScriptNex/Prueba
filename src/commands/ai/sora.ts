import axios from 'axios';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['sora'],
    execute: async (ctx: CommandContext) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return await ctx.reply(styleText('ꕢ Uso: /sora <descripción del video>\n\nEjemplo: /sora un gato volando en el espacio'));
        }
        
        try {
            const response = await axios.get(`https://mayapi.ooguy.com/ai-sora?q=${encodeURIComponent(text)}&apikey=may-4363eca0`, { timeout: 120000 });
            if (response.data?.status && response.data?.video) {
                await (ctx as any).replyWithVideo(response.data.video, { 
                    caption: styleText(`ꕣ *Video generado con Sora AI*\n\n✎ Prompt: ${text}`) 
                });
            } else {
                await ctx.reply(styleText('ꕢ No se pudo generar el video. Intenta con otro prompt.'));
            }
        } catch (error: any) {
            console.error('Error en Sora AI:', error.message);
            if (error.code === 'ECONNABORTED') {
                await ctx.reply(styleText('ꕢ El video está tardando demasiado. Intenta con un prompt más simple.'));
            } else {
                await ctx.reply(styleText('ꕢ Error al generar el video. Intenta más tarde.'));
            }
        }
    }
};

export default command;
