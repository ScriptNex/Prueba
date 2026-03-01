import { styleText, isOwner } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['send'],
    tags: ['owner'],
    help: ['send token <numero> - Genera y envía un token a un usuario'],
    async execute(ctx: CommandContext) {
        const { args, sender, reply, tokenService, bot } = ctx;

        if (!isOwner(sender)) {
            return await reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }

        if (args.length < 2 || args[0].toLowerCase() !== 'token') {
            return await reply(styleText('ꕢ Uso: `#send token <numero> [duracion]`\nEj: `#send token +57 301 3751308 13d`'));
        }

        if (!tokenService) {
            return await reply(styleText('❌ Error: TokenService no disponible.'));
        }

        // Check if the last argument is a duration
        let duration = '30d';
        let durationText = '30 dias';
        let numberParts = args.slice(1);

        const lastArg = args[args.length - 1];
        const timeMatch = lastArg.match(/^(\d+)(d|h|m)$/);

        if (timeMatch) {
            duration = lastArg;
            const value = timeMatch[1];
            const unit = timeMatch[2] === 'd' ? 'dias' : (timeMatch[2] === 'h' ? 'horas' : 'minutos');
            durationText = `${value} ${unit}`;
            numberParts.pop(); // Remove duration from number parts
        }

        // Join potential number parts (e.g. "+57", "301", "...") and clean
        const rawNumber = numberParts.join('');
        const targetNumber = rawNumber.replace(/[^0-9]/g, '');

        if (targetNumber.length < 10) {
            return await reply(styleText('ꕢ Número de teléfono inválido. Asegúrate de escribirlo bien.'));
        }

        const targetJid = `${targetNumber}@s.whatsapp.net`;

        try {
            // Generate token with custom duration
            const token = tokenService.createToken(targetJid, duration);

            // Image URL
            const imageUrl = 'https://i.pinimg.com/1200x/e5/29/50/e52950354a15e6171a3728258d1874e3.jpg';

            // Message text
            const messageText = styleText(
                `ꕣ *Soblend Development Studio*\n\n` +
                `Gracias por ser parte de la familia de Prem-Bots, espero que disfrutes de estos beneficios.\n\n` +
                `> Token » \`${token.id}\`\n` +
                `> Duración » ${durationText}\n\n` +
                `> Puedes usar */prembot ${token.id}* para canjear el token y obtener el codigo para vincular\n` +
                `> ¿Tienes algun error? Contacta con *Soblend Prem-Bots Support* » *+57 301 3751308*`
            );

            // Send message with image
            await bot.sock.sendMessage(targetJid, {
                image: { url: imageUrl },
                caption: messageText
            });

            // Send token separately
            await bot.sock.sendMessage(targetJid, {
                text: token.id
            });

            await reply(styleText(`✅ Token enviado exitosamente a ${targetNumber} por ${durationText}`));

        } catch (error: any) {
            console.error('[Send Token] Error:', error);
            await reply(styleText(`❌ Error al enviar el token: ${error.message}`));
        }
    }
};

export default command;
