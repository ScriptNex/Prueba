import { styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['shop', 'tienda', 'store', 'buy', 'comprar', 'item', 'objeto'],
    async execute(ctx: CommandContext) {
        const { shopService, args } = ctx as any;
        const commandName = (ctx as any).command;

        if (['shop', 'tienda', 'store'].includes(commandName)) {
            const page = parseInt(args[0]) || 1;
            const shopData = shopService.getItems(page, 10);
            
            let text = `╭─────── ୨୧ ───────╮\n`;
            text += `│ *Soblend Shop*\n`;
            text += `│ ✎ \`Página ${shopData.currentPage}/${shopData.totalPages}\`\n`;
            text += `╰─────────────────╯\n\n`;
            text += ` ⟡ *STOCK (Renueva en 5m)*\n\n`;

            if (shopData.items.length === 0) {
                text += `> » No hay objetos en esta página.»;`;
            } else {
                for (const item of shopData.items) {
                    const price = item.price.toLocaleString('es-ES');
                    const stock = item.stock > 0 ? `${item.stock}` : `AGOTADO`;
                    text += `╭─── » *${item.name}*\n`;
                    text += `│ ✿ *ID* » \`${item.id}\`\n`;
                    text += `│ ✿ *Precio* » ${price}\n`;
                    text += `│ ✿ *Stock* » ${stock}\n`;
                    text += `│ ✿ _${item.desc.substring(0, 40)}${item.desc.length > 40 ? '...' : ''}_\n`;
                    text += `╰───────────────────\n\n`;
                }
            }

            const currencyName = await getCurrencyName(ctx);
            text += ` ⟡ *CÓMO COMPRAR*\n`;
            text += `> Usa: *#buy <id> <cantidad>*\n`;
            text += `> Ej: *#buy pot_vida_1 5*\n`;
            text += `> Ver más: *#shop ${page + 1}*`;
            return await ctx.reply(styleText(text));
        }

        if (['buy', 'comprar'].includes(commandName)) {
            const itemId = args[0];
            const quantity = parseInt(args[1]) || 1;

            if (!itemId) {
                return await ctx.reply(styleText(`❌ Ingresa el ID del objeto a comprar.\n> Ejemplo: #buy pot_vida_1 5`));
            }

            if (quantity < 1) {
                return await ctx.reply(styleText(`❌ Cantidad inválida.`));
            }

            const result = await shopService.buyItem(ctx.sender, itemId, quantity);

            if (result.success) {
                const currencyName = await getCurrencyName(ctx);
                return await ctx.reply(styleText(
                    `╭─────── ୨୧ ──────╮\n` +
                    `│ *COMPRA REALIZADA*\n` +
                    `╰─────────────────╯\n` +
                    `✿ *Objeto:* ${result.item.name}\n` +
                    `✿ *Cantidad:* x${quantity}\n` +
                    `✿ *Total:* ${Math.floor(result.item.price * quantity).toLocaleString()} ${currencyName}\n` +
                    `✿ *Nuevo Saldo:* ${result.remainingBalance.toLocaleString()} ${currencyName}`
                ));
            } else {
                return await ctx.reply(styleText(`ꕢ ${result.error}`));
            }
        }

        if (['item', 'objeto'].includes(commandName)) {
            const itemId = args[0];
            if (!itemId) return await ctx.reply(styleText(`ꕢ Ingresa el ID del objeto.`));
            
            const item = shopService.getItem(itemId);
            if (!item) return await ctx.reply(styleText(`ꕢ Objeto no encontrado.`));
            
            const currencyName = await getCurrencyName(ctx);
            return await ctx.reply(styleText(
                `╭────── ୨୧ ─────╮\n` +
                `│ *${item.name.toUpperCase()}*\n` +
                `╰────────────────╯\n` +
                `✿ *ID:* \`${item.id}\`\n` +
                `✿ *Precio:* ${item.price.toLocaleString()} ${currencyName}\n` +
                `✿ *Categoría:* ${item.category}\n` +
                `✿ *Stock:* ${item.stock}\n\n` +
                `✿ *Descripción:*\n> ${item.desc}\n\n` +
                (item.effect ? `✿ *Efecto:* ${JSON.stringify(item.effect)}` : '')
            ));
        }
    }
};

export default command;
