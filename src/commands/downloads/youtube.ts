import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['youtube', 'yt'],
    async execute(ctx: CommandContext) {
        try {
            if (ctx.args.length === 0) {
                return await ctx.reply(styleText(`《✧》 *Uso incorrecto del comando*\n\n*Ejemplos:*\n✿ #youtube https://youtu.be/xxxxx\n✿ #yt https://www.youtube.com/watch?v=xxxxx`));
            }
            const url = ctx.args[0];
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                return await ctx.reply(styleText('《✧》 Por favor ingresa un link válido de YouTube.'));
            }
            await ctx.reply(styleText(`Usa:\n• #ytmp3 ${url} para audio\n• #ytmp4 ${url} para video`));
        } catch (error) {
            console.error('Error en comando youtube:', error);
            await ctx.reply(styleText(`《✧》 Error al procesar el enlace de YouTube.`));
        }
    }
};

export default command;
