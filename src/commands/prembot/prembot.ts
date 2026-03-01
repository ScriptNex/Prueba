import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['prembot'],
    async execute(ctx: CommandContext) {
        const { args, reply, isOwner, sender, tokenService, prembotManager, senderPhone, chatId, bot } = ctx;
        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || subCommand === 'help') {
            return await reply(styleText(
                `ꕣ *PREMBOT - Sub-Bot Premium*\n\n` +
                `*Comandos disponibles:*\n\n` +
                `> *#prembot buy*\n` +
                `>   Comprar token ($13 USD)\n\n` +
                `> *#prembot TOKEN-XXXX*\n` +
                `>   Vincular con tu token\n\n` +
                `> *#prembot status*\n` +
                `>   Ver estado de tu Prembot\n\n` +
                `> *#prembot stop*\n` +
                `>   Detener tu Prembot\n\n` +
                `> _Los Prembots tienen todas las funciones premium_`
            ));
        }

        if (subCommand === 'generate' && args[1] === 'token') {
            if (!isOwner) {
                return await reply(styleText('❌ No tienes permiso para usar este comando.'));
            }
            if (!tokenService) return;
            const token = tokenService.createToken(sender, '30d');
            await reply(
                styleText(`ꕣ *Token Generado*\n\n` +
                `> *ID* » `) + `\`${token.id}\`` + styleText(`\n` +
                `> *Duración* » 30 días\n\n` +
                `> _Usa #prembot_ `) + token.id + styleText(` _para activar_`)
            );
            return;
        }

        if (subCommand === 'buy') {
            if (!tokenService) return;
            const config = (tokenService as any).paypal || {};
            if (!config.clientId) {
                return await reply(styleText(
                    `ꕣ *PREMBOT - Comprar Token*\n\n` +
                    `> *Precio:* $13 USD\n` +
                    `> *Duración:* 30 días\n\n` +
                    `*Métodos de pago:*\n\n` +
                    `> *PayPal:* contactar al owner\n\n` +
                    `*Después de pagar:*\n` +
                    `> 1. Envía captura del pago al owner\n` +
                    `> 2. El owner te enviará tu token\n` +
                    `> 3. Usa #prembot TOKEN-XXXX para vincular\n\n` +
                    `> _Contacta al owner para más info_`
                ));
            }
            await reply(styleText('ꕢ Generando enlace de pago...'));
            try {
                const userId = senderPhone ? `${senderPhone}@s.whatsapp.net` : sender;
                const result = await tokenService.createPayPalOrder(userId);
                if (result.success) {
                    await reply(
                        styleText(`ꕣ *PREMBOT - Pago PayPal*\n\n` +
                        `> *Precio* » *$13 USD*\n` +
                        `> *Order* » `) + result.orderId + styleText(`\n\n` +
                        `*Haz clic para pagar:*\n` +
                        `> `) + result.approvalUrl + styleText(`\n\n` +
                        `*> Después de pagar:*\n` +
                        `> Envía "#prembot verify `) + result.orderId + styleText(`"\n\n` +
                        `> _El enlace expira en 3 horas_`)
                    );
                } else {
                    await reply(styleText(`❌ Error: ${result.error}`));
                }
            } catch (error: any) {
                await reply(styleText(
                    `ꕣ *PREMBOT - Comprar Token*\n\n` +
                    `> *Precio* » $13 USD\n\n` +
                    `> PayPal no está configurado.\n` +
                    `> Contacta al owner para comprar.`
                ));
            }
            return;
        }

        if (subCommand === 'verify' && args[1]) {
            if (!tokenService) return;
            const orderId = args[1];
            await reply(styleText('ꕢ Verificando pago...'));
            try {
                const result = await tokenService.capturePayPalOrder(orderId);
                if (result.success) {
                    const payment = tokenService.getPayment(orderId);
                    await reply(
                        styleText(`ꕣ *Pago verificado*\n\n` +
                        `> *Tu Token* » \n`) +
                        `\`${payment?.tokenId}\`` + styleText(`\n\n` +
                        `*Ahora ejecuta:*\n` +
                        `> #prembot `) + payment?.tokenId + styleText(`\n\n` +
                        `> _El token es válido por 30 días_`)
                    );
                } else {
                    await reply(styleText(`ꕢ Pago no completado » ${result.error || 'Verifica que hayas pagado'}`));
                }
            } catch (error: any) {
                await reply(styleText(`ꕢ Error verificando » ${error.message}`));
            }
            return;
        }

        if (subCommand === 'status') {
            const userId = senderPhone ? `${senderPhone}@s.whatsapp.net` : sender;
            const status = prembotManager?.getPrembotStatus(userId);
            if (!status) {
                return await reply(styleText(
                    `ꕢ No tienes un Prembot activo.\n\n` +
                    `> Usa #prembot buy para comprar uno.`
                ));
            }
            const statusIcon = status.active ? '🟢' : '🔴';
            const bannedText = status.banned ? '⛔ BANEADO' : '';
            await reply(styleText(
                `ꕣ *PREMBOT - Estado*\n\n` +
                `${statusIcon} *Estado:* ${status.active ? 'Activo' : 'Inactivo'} ${bannedText}\n` +
                `> *Expira* » ${status.expiresAt}\n` +
                `> *Días restantes* » ${status.daysRemaining}\n\n` +
                `> *Estadísticas:*\n` +
                `> • Mensajes » ${status.stats.messages}\n` +
                `> • Comandos » ${status.stats.commands}\n\n` +
                `> *Límites* » \n` +
                `> • Grupos » ${status.limits.groups}\n` +
                `> • Cmds/min » ${status.limits.commandsPerMin}`
            ));
            return;
        }

        if (subCommand === 'stop') {
            const userId = senderPhone ? `${senderPhone}@s.whatsapp.net` : sender;
            const result = prembotManager?.stopPrembot(userId);
            if (result?.success) {
                await reply(styleText(result.message));
            } else {
                await reply(styleText(result?.message || 'ꕢ No tienes un Prembot activo'));
            }
            return;
        }

        if (subCommand.startsWith('token-')) {
            const tokenId = subCommand.toUpperCase();
            const phone = senderPhone;
            if (!phone || phone.length < 10) {
                return await reply(styleText(
                    'ꕢ No se detectó tu número de teléfono.\n' +
                    '> Intenta desde un chat privado con el bot.'
                ));
            }
            const validation = tokenService?.validateToken(tokenId);
            if (!validation?.valid) {
                return await reply(styleText(`ꕢ ${validation?.error || 'Token inválido'}`));
            }
            await reply(styleText(`ꕢ Iniciando vinculación para ${phone}...`));
            const result = await prembotManager!.startPrembot(
                tokenId,
                chatId,
                bot,
                phone
            );
            if (!result.success) {
                await reply(styleText(result.message));
            }
            return;
        }

        await reply(styleText(
            `ꕢ Comando no reconocido.\n\n` +
            `> Usa *#prembot help* para ver comandos.`
        ));
    }
};

export default command;
