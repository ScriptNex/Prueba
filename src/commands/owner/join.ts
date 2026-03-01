import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['join', 'invite', 'unirse'],
    async execute(ctx: CommandContext) {
        const { args, reply, bot } = ctx;
        const link = args[0];

        if (!link) {
            return await reply(styleText(
                `ꕢ *Uso del Comando*\n\n` +
                `> /join <link del grupo>\n` +
                `> /invite <link del grupo>\n\n` +
                `*Ejemplo:*\n` +
                `> /join https://chat.whatsapp.com/ABC123xyz`
            ));
        }

        let inviteCode = link;
        if (link.includes('chat.whatsapp.com/')) {
            inviteCode = link.split('chat.whatsapp.com/')[1];
        } else if (link.includes('whatsapp.com/')) {
            inviteCode = link.split('whatsapp.com/')[1];
        }

        inviteCode = inviteCode?.split('?')[0]?.split('#')[0]?.trim();

        if (!inviteCode) {
            return await reply(styleText(
                `❌ *Error*\n\n` +
                `> El link proporcionado no es válido.\n` +
                `> Asegúrate de enviar un link de invitación de WhatsApp.`
            ));
        }

        try {
            await reply(styleText(
                `ꕢ *Procesando...*\n\n` +
                `> Intentando unirse al grupo...`
            ));

            const result = await bot.sock.groupAcceptInvite(inviteCode);

            if (result) {
                await reply(styleText(
                    `ꕣ *¡Éxito!*\n\n` +
                    `> Me he unido al grupo correctamente.\n` +
                    `> ID del grupo: ${result}`
                ));
            } else {
                await reply(styleText(
                    `ꕣ *¡Listo!*\n\n` +
                    `> Solicitud enviada correctamente.`
                ));
            }
        } catch (error: any) {
            logger.error('Error al unirse al grupo:', error);
            let errorMessage = 'Ocurrió un error desconocido.';
            const msg = error.message || '';
            
            if (msg.includes('invalid')) {
                errorMessage = 'El link de invitación no es válido o ha expirado.';
            } else if (msg.includes('not-authorized')) {
                errorMessage = 'No estoy autorizado para unirme a este grupo.';
            } else if (msg.includes('already')) {
                errorMessage = 'Ya estoy en este grupo.';
            } else if (msg.includes('forbidden')) {
                errorMessage = 'El acceso a este grupo está restringido.';
            } else if (msg.includes('gone')) {
                errorMessage = 'El link de invitación ha expirado o fue revocado.';
            }

            await reply(styleText(
                `ꕣ *Error al Unirse*\n\n` +
                `> ${errorMessage}\n\n` +
                `*Sugerencias:*\n` +
                `> • Verifica que el link sea correcto\n` +
                `> • Asegúrate de que el link no haya expirado\n` + 
                `> • Confirma que el grupo permita nuevos miembros`
            ));
        }
    }
};

export default command;
