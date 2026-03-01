import { extractMentions, formatNumber, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['givecoins', 'darcoins', 'pay', 'transfer'],

    async execute(ctx: CommandContext) {
        if (ctx.args.length < 2) {
            return await ctx.reply(styleText('ꕢ Uso: *#givecoins* `<@usuario>` `<cantidad>`'));
        }

        const extractCleanNumber = (id: string) => {
            if (!id) return '';
            let num = id.split('@')[0];
            if (num.includes(':')) {
                num = num.split(':')[1] || num.split(':')[0];
            }
            return num.replace(/\D/g, '');
        };

        // Obtener menciones del mensaje
        let mentions: string[] = [];

        const msg: any = ctx.msg;
        if (msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
        }

        if (mentions.length === 0) {
            mentions = extractMentions(ctx);
        }

        if (mentions.length === 0) {
            return await ctx.reply(styleText('ꕢ Debes mencionar a un usuario.'));
        }

        // Guardar el @lid original
        const targetLid = mentions[0];
        let target = targetLid;

        // Convertir @lid a @s.whatsapp.net si es necesario
        if (target.includes('@lid')) {
            const phoneNumber = target.split('@')[0].split(':')[0];
            if (phoneNumber && /^\d+$/.test(phoneNumber)) {
                target = `${phoneNumber}@s.whatsapp.net`;
            }
        }

        if (!target.includes('@s.whatsapp.net') && !target.includes('@lid')) {
            target = `${target}@s.whatsapp.net`;
        }

        // Validar cantidad
        const amount = parseInt(ctx.args[1]);
        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕢ La cantidad debe ser un número mayor a 0.'));
        }

        // No transferir a uno mismo
        const senderNumber = extractCleanNumber(ctx.sender);
        const targetNumber = extractCleanNumber(target);

        if (senderNumber === targetNumber) {
            return await ctx.reply(styleText('ꕢ No puedes transferirte coins a ti mismo.'));
        }

        // Verificar saldo del remitente
        const senderData = await ctx.dbService.getUser(ctx.sender, ctx.senderLid);
        const senderEconomy = senderData.economy || { coins: 0 };
        const senderCoins = senderEconomy.coins || 0;

        if (senderCoins < amount) {
            return await ctx.reply(styleText(`ꕢ No tienes suficientes coins. Tienes: ¥${formatNumber(senderCoins)}`));
        }

        // CLAVE: Pasar AMBOS IDs al getUser
        const targetData = await ctx.dbService.getUser(target, targetLid);
        const targetEconomy = targetData.economy || { coins: 0 };
        const targetCoins = targetEconomy.coins || 0;

        // Usar el ID que realmente tiene en la base de datos
        const targetRealId = targetData.id;

        // Actualizar saldos usando los IDs reales
        await ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': senderCoins - amount
        });

        await ctx.dbService.updateUser(targetRealId, {
            'economy.coins': targetCoins + amount
        });

        await ctx.dbService.save();

        // Mensaje de confirmación con mención
        const currencyName = await getCurrencyName(ctx);
        const displayName = targetData.name || targetNumber;

        await ctx.reply(
            styleText(`ꕣ Transferiste ¥${formatNumber(amount)} ${currencyName} a @${displayName}\n\n` +
                `Tu saldo: ¥${formatNumber(senderCoins - amount)}`),
            { mentions: [targetLid] } // Usar el LID original para la mención
        );
    }
};

export default command;
