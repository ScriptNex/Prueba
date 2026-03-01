import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['suggest', 'sugerencia', 'sugest'],
    tags: ['tools'],
    help: ['suggest <texto>'],
    async execute(ctx: CommandContext) {
        const { text, bot, sender, reply, msg } = ctx;
        const msgAny: any = msg;
        const adminNumber = '639972367773@s.whatsapp.net';
        
        if (!text) {
            return await reply(styleText('ꕢ Por favor escribe tu sugerencia.\nEjemplo: #suggest Agregar más juegos'));
        }

        try {
            const originalSender = msgAny.key?.participant || sender;
            const suggestionMsg = `ꕣ *Nueva Sugerencia*\n\n` +
                `> *De* » @${originalSender.split('@')[0]}\n` +
                `> *Mensaje* » ${text}`;

            await bot?.sock.sendMessage(adminNumber, {
                text: suggestionMsg,
                mentions: [originalSender]
            });

            await reply(styleText('ꕢ ¡Gracias! Tu sugerencia ha sido enviada al administrador.'));
        } catch (error) {
            logger.error('Error enviando sugerencia:', error);
            await reply(styleText('ꕢ Hubo un error al enviar la sugerencia. Intenta más tarde.'));
        }
    }
};

export default command;
