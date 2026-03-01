import { styleText, isOwner } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['viewp'],
    tags: ['owner'],
    help: ['viewp <token/numero> - Ver información de un prembot o token'],
    async execute(ctx: CommandContext) {
        const { args, sender, reply, tokenService } = ctx;

        if (!isOwner(sender)) {
            return await reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }

        if (args.length < 1) {
            return await reply(styleText('ꕢ Debes proporcionar un token o un número de teléfono.'));
        }

        if (!tokenService) {
            return await reply(styleText('❌ Error: TokenService no disponible.'));
        }

        const input = args[0];
        let message = '';

        // Check if input is a token (starts with TOKEN-)
        if (input.startsWith('TOKEN-')) {
            const token = (tokenService as any).data.tokens.find((t: any) => t.id === input);
            if (token) {
                const createdDate = new Date(token.createdAt).toLocaleString();
                const expiryDate = new Date(token.expiresAt).toLocaleString();
                const daysRemaining = Math.max(0, Math.ceil((token.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
                const usedBy = token.usedBy ? token.usedBy.split('@')[0] : 'Nadie';
                const status = token.used ? '🔴 Usado' : '🟢 Disponible';

                message = styleText(
                    `🎫 *Información del Token*\n\n` +
                    `> *ID* » \`${token.id}\`\n` +
                    `> *Estado* » ${status}\n` +
                    `> *Creado* » ${createdDate}\n` +
                    `> *Duración* » ${token.duration}\n` +
                    `> *Usado por* » ${usedBy}\n` +
                    `> *Expira* » ${expiryDate}\n` +
                    `> *Días restantes* » ${daysRemaining} días`
                );
            } else {
                message = styleText('❌ Token no encontrado.');
            }
        } else {
            // Assume it's a phone number
            const cleanPhone = input.replace(/[^0-9]/g, '');
            const userId = `${cleanPhone}@s.whatsapp.net`;
            const prembot = tokenService.getPrembot(userId);

            if (prembot) {
                const connectedDate = new Date(prembot.connectedAt).toLocaleString();
                const expiryDate = new Date(prembot.expiresAt).toLocaleString();
                const daysRemaining = Math.max(0, Math.ceil((prembot.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
                const lastToken = prembot.tokenId;

                message = styleText(
                    `🤖 *Información del Prembot*\n\n` +
                    `> *Usuario* » ${cleanPhone}\n` +
                    `> *Token Actual* » \`${lastToken}\`\n` +
                    `> *Conectado* » ${connectedDate}\n` +
                    `> *Expira* » ${expiryDate}\n` +
                    `> *Días restantes* » ${daysRemaining} días\n` +
                    `> *Estado* » ${prembot.banned ? '🔴 Baneado' : '🟢 Activo'}`
                );
            } else {
                message = styleText('❌ No se encontró un prembot registrado con ese número.');
            }
        }

        await reply(message);
    }
};

export default command;
