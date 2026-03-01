import { formatNumberLarge, extractMentions, styleText, getCooldown, formatTime, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['einfo'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }

        const mentions = extractMentions(ctx);
        let target = mentions.length > 0 ? mentions[0] : ctx.sender;
        const targetLid = target; 

        if (target.includes('@lid')) {
            if (target === ctx.senderLid && (ctx as any).senderPhone) {
                target = `${(ctx as any).senderPhone}@s.whatsapp.net`;
            } else {
                const phoneNumber = target.split('@')[0].split(':')[0];
                if (phoneNumber && /^\d+$/.test(phoneNumber)) {
                    target = `${phoneNumber}@s.whatsapp.net`;
                }
            }
        }

        if (!target.includes('@s.whatsapp.net') && !target.includes('@lid')) {
            target = `${target}@s.whatsapp.net`;
        }

        const userData = await ctx.dbService.getUser(target, targetLid);

        if (!userData) {
            return await ctx.reply(styleText('ꕢ Usuario no encontrado en la base de datos.'));
        }

        const economy = userData.economy || { coins: 0, bank: 0 };
        const total = (economy.coins || 0) + (economy.bank || 0);
        
        const cooldowns = {
            work: getCooldown(economy.lastWork || 0, 1 * 60 * 1000),
            daily: getCooldown(economy.lastDaily || 0, 24 * 60 * 60 * 1000),
            crime: getCooldown(economy.lastCrime || 0, 10 * 60 * 1000),
            slut: getCooldown(economy.lastSlut || 0, 10 * 60 * 1000),
            fish: getCooldown(economy.lastFish || 0, 30 * 1000)
        };
        
        const currencyName = await getCurrencyName(ctx);

        let message = `╭─────── ୨୧ ───────╮\n`;
        message += `│ *ECONOMY INFO* \n`;
        message += `╰────────────────╯\n`;
        message += `✿ *::* *Usuario* › @${target.split('@')[0]}\n\n`;

        message += `╭─── ⚐ Balance ───╮\n`;
        message += `│ *Efectivo* › ${formatNumberLarge(economy.coins || 0)} ${currencyName}\n`;
        message += `│ *Banco*    › ${formatNumberLarge(economy.bank || 0)} ${currencyName}\n`;
        message += `│ *Total*    › ${formatNumberLarge(total)} ${currencyName}\n`;
        message += `╰────────────────╯\n\n`;

        message += `╭─── ⚐ Cooldowns ───╮\n`;
        message += `│ *Work*  › ${cooldowns.work > 0 ? formatTime(cooldowns.work) : '✔'}\n`;
        message += `│ *Daily* › ${cooldowns.daily > 0 ? formatTime(cooldowns.daily) : '✔'}\n`;
        message += `│ *Crime* › ${cooldowns.crime > 0 ? formatTime(cooldowns.crime) : '✔'}\n`;
        message += `│ *Slut*  › ${cooldowns.slut > 0 ? formatTime(cooldowns.slut) : '✔'}\n`;
        message += `│ *Fish*  › ${cooldowns.fish > 0 ? formatTime(cooldowns.fish) : '✔'}\n`;
        message += `╰────────────────╯`;

        await ctx.reply(styleText(message), { mentions: [targetLid] });
    }
};

export default command;
