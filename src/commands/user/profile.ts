import { formatNumber, styleText } from '../../utils/helpers.js';
import { ASSETS } from '../../config/assets.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['profile', 'perfil', 'setbirth', 'setgen'],
    async execute(ctx: CommandContext) {
        const { command: cmdName, args, sender, dbService, bot, chatId, userData, reply } = ctx;

        if (!userData) return await reply(styleText('Error obteniendo datos de usuario.'));
        if (!userData.profile) userData.profile = {};

        if (cmdName === 'setbirth') {
            const birth = args.join(' ');
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            if (!dateRegex.test(birth)) {
                return await reply(styleText('ꕢ Formato inválido. Usa DD/MM/YYYY (Ej: 01/01/2000)'));
            }
            await dbService?.updateUser(sender, { 'profile.birthday': birth });
            return await reply(styleText(`ꕣ Cumpleaños establecido a: ${birth}`));
        }

        if (cmdName === 'setgen') {
            const gen = args[0]?.toLowerCase();
            if (!['m', 'f'].includes(gen)) {
                return await reply(styleText('ꕢ Género inválido. Usa *m* (Masculino) o *f* (Femenino).'));
            }
            const gender = gen === 'm' ? 'Masculino' : 'Femenino';
            await dbService?.updateUser(sender, { 'profile.gender': gender });
            return await reply(styleText(`ꕣ Género establecido a: ${gender}`));
        }

        let pfp: any;
        try {
            pfp = { url: await bot?.sock.profilePictureUrl(sender, 'image') };
        } catch (e) {
            try {
                if (existsSync(ASSETS.IMAGES.DEFAULT)) {
                    const buffer = await fs.readFile(ASSETS.IMAGES.DEFAULT);
                    pfp = buffer;
                } else {
                    pfp = { url: 'https://i.imgur.com/K2T39Xw.png' };
                }
            } catch (err) {
                pfp = { url: 'https://i.imgur.com/K2T39Xw.png' };
            }
        }

        const rank = await dbService?.getUserEconomyRank(sender) || 0;
        const harem = userData.gacha?.characters || [];
        const totalValue = harem.reduce((acc: number, char: any) => acc + (parseInt(char.value) || 0), 0);

        // XP / Level calculation
        const xp = userData.xp || 0;
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;
        const xpForNextLevel = Math.pow(level, 2) * 100;
        const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
        const xpProgress = xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const percent = Math.floor((xpProgress / xpNeeded) * 100) || 0;

        const totalCommands = userData.stats?.commands || 0;
        const birth = userData.profile?.birthday || 'No establecido';
        const gender = userData.profile?.gender || 'No establecido';
        const name = userData.name || sender.split('@')[0];

        let message = `「ʚଓ」 Profile ◢ ${name} ◤\n\n`;
        message += `∘ Cumpleaños » ${birth} | ${birth === 'No establecido' ? '(/setbirth)' : ''}\n`;
        message += `∘ Género » ${gender} | ${gender === 'No establecido' ? '(/setgen)' : ''}\n\n`;
        message += `∘ Progreso » ${Math.floor(xp)} / ${xpForNextLevel} (${percent}%)\n`;
        message += `∘ Puesto » #${rank > 0 ? rank : '?'}\n\n`;
        message += `∘ Harem » ${harem.length}\n`;
        message += `∘ Valor total » ${formatNumber(totalValue)}\n`;
        message += `∘ Coins totales » ¥${formatNumber((userData.economy?.coins || 0) + (userData.economy?.bank || 0))} Coins\n`;
        message += `∘ Comandos totales » ${totalCommands}`;

        // Exclusive Emblem for specific user
        if (sender.includes('5492216801248')) {
            message += `\n\n🏆 *Emblema* » 1er usuario en llegar al Decillon`;
        }

        await bot?.sock.sendMessage(chatId, {
            image: pfp,
            caption: styleText(message),
            mentions: [sender]
        });
    }
};

export default command;
