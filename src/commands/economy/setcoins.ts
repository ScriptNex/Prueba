import { styleText, isOwner } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['setcoins', 'setmoneda'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) {
            return await ctx.reply(styleText('ꕢ Este comando solo puede usarse en grupos.'));
        }
        
        const globalAny = global as any;
        const isBotOwner = isOwner(ctx.sender, globalAny.botOwner);
        const isPremOrSubOwner = ctx.isPrembot || (ctx as any).isSubbot;

        if (!isBotOwner && !isPremOrSubOwner) {
            return await ctx.reply(styleText(
                `ꕢ *Acceso Denegado*\n\n` +
                `> Este comando solo está disponible para:\n` +
                `> • Owner del Bot Oficial\n` +
                `> • Dueños de PremBots\n` +
                `> • Dueños de SubBots\n\n` +
                `> _Usa #prembot buy para obtener un PremBot_`
            ));
        }

        const currencyName = ctx.args.join(' ').trim();
        if (!currencyName) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            const currentName = groupData?.settings?.currencyName || 'coins';
            return await ctx.reply(styleText(
                `ꕣ *Configurar Nombre de Moneda*\n\n` +
                `*Uso:* #setcoins <nombre>\n\n` +
                `*Nombre actual:* ${currentName}\n\n` +
                `*Ejemplos:*\n` +
                `> #setcoins KanaCoins\n` +
                `> #setcoins AlyaCoins\n` +
                `> #setcoins Créditos\n\n` +
                `> _El nombre aparecerá en todos los comandos de economía_`
            ));
        }

        if (currencyName.length > 20) {
            return await ctx.reply(styleText(
                `ꕢ *Error*\n\n` +
                `> El nombre de la moneda es muy largo.\n` +
                `> Máximo: 20 caracteres\n` +
                `> Tu nombre tiene: ${currencyName.length} caracteres`
            ));
        }

        await ctx.dbService.updateGroup(ctx.chatId, {
            'settings.currencyName': currencyName
        });

        await ctx.reply(styleText(
            `ꕣ *Moneda Configurada*\n\n` +
            `> Nombre establecido: *${currencyName}*\n\n` +
            `> _Ahora todos los comandos de economía mostrarán "${currencyName}" en lugar de "coins"_\n\n` +
            `> *Pruébalo:*\n` +
            `> #work\n` +
            `> #balance\n` +
            `> #daily`
        ));
    }
};

export default command;
