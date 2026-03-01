import { styleText, isOwner } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['generate'],
    tags: ['owner'],
    help: ['generate token <cantidad> <d/y> - Genera un token premium'],
    async execute(ctx: CommandContext) {
        const { args, sender, reply, tokenService } = ctx;

        if (!isOwner(sender)) {
            return await reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }

        if (args.length < 3 || args[0].toLowerCase() !== 'token') {
            return await reply(styleText(
                'ꕢ Uso incorrecto.\n\n' +
                '*Ejemplos:*\n' +
                '> #generate token 30 d  (30 días)\n' +
                '> #generate token 1 y   (1 año)\n' +
                '> #generate token 90 d  (90 días)'
            ));
        }

        const cantidad = parseInt(args[1]);
        const unidad = args[2].toLowerCase();

        if (isNaN(cantidad) || cantidad <= 0) {
            return await reply(styleText('ꕢ La cantidad debe ser un número positivo.'));
        }

        if (!['d', 'y'].includes(unidad)) {
            return await reply(styleText('ꕢ La unidad debe ser "d" (días) o "y" (años).'));
        }

        try {
            if (!tokenService) throw new Error('Token service not available');

            const durationParam = unidad === 'y' ? `${cantidad * 365}d` : `${cantidad}${unidad}`;
            const token = tokenService.createToken(sender, durationParam);

            let duracionTexto;
            if (unidad === 'd') {
                duracionTexto = `${cantidad} día${cantidad > 1 ? 's' : ''}`;
            } else {
                duracionTexto = `${cantidad} año${cantidad > 1 ? 's' : ''}`;
            }

            await reply(styleText(
                `ꕣ *Token Generado Exitosamente*\n\n` +
                `> *ID* » \`${token.id}\`\n` +
                `> *Duración* » ${duracionTexto}\n` +
                `> *Creado* » ${new Date(token.createdAt).toLocaleString()}\n\n` +
                `> _Usa #prembot ${token.id} para activar_`
            ));

        } catch (error: any) {
            console.error('[Generate] Error:', error);
            await reply(styleText(`❌ Error al generar el token: ${error.message}`));
        }
    }
};

export default command;
