import { formatNumber, extractMentions, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['steal', 'robar'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }

        let target: string | null = null;
        const mentions = extractMentions(ctx);

        if (mentions.length > 0) {
            target = mentions[0];
        } else if (ctx.args.length > 0) {
            const potentialNumber = ctx.args[0].replace('@', '');
            if (/^\d+$/.test(potentialNumber)) {
                target = `${potentialNumber}@s.whatsapp.net`;
            }
        }

        if (!target) {
            return await ctx.reply(styleText('ꕢ Debes mencionar a un usuario.\nUso: *#steal* @usuario'));
        }

        const msg: any = ctx.msg;
        if (target.includes('@lid')) {
            const participant = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.find((j: string) => j.includes('@s.whatsapp.net'));
            if (participant) target = participant;
        }

        if (target === ctx.sender) {
            return await ctx.reply(styleText('ꕢ No puedes robarte a ti mismo.'));
        }

        const user = await ctx.dbService.getUser(ctx.sender);
        const userData = user?.economy || { coins: 0 };
        
        const targetUser = await ctx.dbService.getUser(target);
        const targetData = targetUser?.economy || { coins: 0 };
        
        const currencyName = await getCurrencyName(ctx);

        const SUCCESS_RATE = 0.5;
        const success = Math.random() < SUCCESS_RATE;

        if (success) {
            const targetCoins = targetData.coins || 0;
            const maxSteal = Math.floor(targetCoins * 0.3);
            const stolen = Math.floor(Math.random() * maxSteal) + 1;

            await ctx.dbService.updateUser(target, {
                'economy.coins': Math.max(0, targetCoins - stolen)
            });
            await ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': (userData.coins || 0) + stolen
            });

            await ctx.reply(
                styleText(`ꕣ Robaste *¥${formatNumber(stolen)}* ${currencyName} a @${target!.split('@')[0]}`),
                { mentions: [target!] }
            );
        } else {
            const fine = Math.floor(Math.random() * 1000) + 500;
            const userCoins = userData.coins || 0;
            const lostAmount = Math.min(userCoins, fine);

            await ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': Math.max(0, userCoins - fine)
            });

            await ctx.reply(
                styleText(`ꕢ *Te atraparon!*\n\n` +
                    `Intentaste robar a @${target!.split('@')[0]} pero te atraparon.\n` +
                    `> ✿ Multa » *¥${formatNumber(fine)}* ${currencyName}\n` +
                    `> ✿ Tu balance » *¥${formatNumber(Math.max(0, userCoins - fine))}* ${currencyName}`),
                { mentions: [target!] }
            );
        }
    }
};

export default command;
