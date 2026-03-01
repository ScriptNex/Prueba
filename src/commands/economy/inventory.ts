import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['inventory', 'inv', 'bag', 'use', 'usar'],
    async execute(ctx: CommandContext) {
        const { shopService, command, args, dbService } = ctx as any;
        
        if (['inventory', 'inv', 'bag'].includes(command)) {
            const inventory = await shopService.getInventory(ctx.sender);
            if (inventory.length === 0) {
                return await ctx.reply(styleText(`🎒 *Tu inventario está vacío.*\n> Ve a la #shop para comprar cosas.`));
            }
            
            let text = `🎒 *INVENTARIO DE ${ctx.from.name.toUpperCase()}*\n\n`;
            for (const item of inventory) {
                if (item.count > 0) {
                    text += `▪️ *${item.name}* (x${item.count})\n`;
                    text += `> ID: ${item.id}\n`;
                }
            }
            text += `\n> ꕢ Usa *#use <id>* para usar un objeto.`;
            return await ctx.reply(styleText(text));
        }

        if (['use', 'usar'].includes(command)) {
            const itemId = args[0];
            if (!itemId) return await ctx.reply(styleText(`ꕢ Ingresa el ID del objeto a usar.`));
            
            const user = await dbService.getUser(ctx.sender);
            const inventory = user.inventory || [];
            const itemIndex = inventory.findIndex((i: any) => i.id === itemId);
            
            if (itemIndex === -1 || inventory[itemIndex].count < 1) {
                return await ctx.reply(styleText(`ꕢ No tienes este objeto.`));
            }

            const itemDef = shopService.items.get(itemId);
            if (!itemDef) return await ctx.reply(styleText(`ꕢ Error de datos del objeto.`));
            
            if (itemDef.category !== 'Consumible' && itemDef.category !== 'Potenciador') {
                return await ctx.reply(styleText(`ꕢ Este objeto no se puede "usar" directamente.`));
            }

            inventory[itemIndex].count -= 1;
            if (inventory[itemIndex].count <= 0) {
                inventory.splice(itemIndex, 1);
            }

            let msg = `ꕢ Usaste *${itemDef.name}*.\n\n`;
            if (itemDef.effect) {
                if (itemDef.effect.type === 'restore') {
                    msg += `> Te sientes renovado (Efecto visual).`;
                }
                else if (itemDef.effect.type === 'multiplier') {
                    msg += `> ¡Potenciador activado! (WIP: Efecto real pendiente)`;
                }
            } else {
                msg += `> No pasó nada interesante.`;
            }

            await dbService.updateUser(ctx.sender, { inventory });
            return await ctx.reply(styleText(msg));
        }
    }
};

export default command;
