import { formatNumber, getCooldown, formatTime, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['daily', 'diario'],
    tags: ['economy'],
    help: ['daily'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }
        
        const currencyName = await getCurrencyName(ctx);
        const userData = await ctx.dbService.getUser(ctx.sender);
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000;
        
        const lastDaily = userData.economy?.lastDaily || 0;
        const cooldown = getCooldown(lastDaily, COOLDOWN);
        
        if (cooldown > 0) {
            return await ctx.reply(styleText(`ꕢ Ya reclamaste tu recompensa diaria.\nVuelve en: *${formatTime(cooldown)}*`));
        }

        const timeSinceLast = now - lastDaily;
        const streakTimeLimit = 48 * 60 * 60 * 1000;
        let streak = (userData.economy?.dailyStreak || 0);
        
        if (timeSinceLast < streakTimeLimit && lastDaily !== 0) {
            streak += 1;
        } else {
            streak = 1;
        }

        const reward = streak * 10000;
        const currentCoins = userData.economy?.coins || 0;
        
        await ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': currentCoins + reward,
            'economy.lastDaily': now,
            'economy.dailyStreak': streak
        });

        let message = `ꕣ *RECOMPENSA DIARIA*\n\n`;
        message += `> Día » ¥${streak}\n`;
        message += `> Recompensa » *¥${formatNumber(reward)}* ${currencyName}\n`;
        
        if (streak > 1) {
            message += `\n_¡Mantén la racha para ganar más!_`;
        } else if (lastDaily !== 0) {
            message += `\n_¡Perdiste tu racha! Vuelve mañana para continuar._`;
        }
        
        await ctx.reply(styleText(message));
    }
};

export default command;
