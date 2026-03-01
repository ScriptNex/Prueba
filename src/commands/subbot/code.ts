import { jadibotManager } from '../../services/external/jadibot.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['code', 'jadibot', 'serbot', 'subbot'],
    async execute(ctx: CommandContext) {
        const { args, chatId, senderPhone, command: cmdName, bot, sender, reply } = ctx;
        const phone = senderPhone;
        
        if (cmdName === 'code') {
            if (!phone || phone.length < 10) {
                return await reply(
                    styleText('❌ *No se pudo detectar tu número*\n\n' +
                        'WhatsApp no envió tu número de teléfono.\n' +
                        'Intenta desde un chat privado con el bot.')
                );
            }
            await reply(styleText(`⏳ Generando código para: ${phone}...`));
            const result = await (jadibotManager as any).startSubbot(null, chatId, bot?.sock, phone);
            if (!result.success) await reply(styleText(result.message));
            return;
        }
        
        const displayPhone = phone || 'tu número';
        const userId = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;
        const code = (jadibotManager as any).createCode(userId);
        
        await reply(styleText(
            `ꕣ *Jadibot - Sub-Bot*\n\n` +
            `Elige un método para vincular:\n\n` +
            `> *Opción 1: Código de 8 Dígitos*\n` +
            `> Usa \`#code\` para recibir el código\n` +
            `> _Tu número: ${displayPhone}_\n\n` +
            `> *Opción 2: Código QR*\n` +
            `> Usa \`#qr ${code}\` para ver el QR\n` +
            `_Expira en 5 minutos_`
        ));
    }
};

export default command;
