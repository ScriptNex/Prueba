import axios from 'axios';
import { formatNumber, getCooldown, formatTime, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const imageCache = new Map<string, Buffer>();
const COOLDOWN_TIME = 10 * 60 * 1000;

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
    if (imageCache.has(url)) {
        return imageCache.get(url)!;
    }
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 5000,
            maxRedirects: 3
        });
        const buffer = Buffer.from(response.data);
        if (imageCache.size >= 50) {
            const firstKey = imageCache.keys().next().value;
            if (firstKey) imageCache.delete(firstKey);
        }
        imageCache.set(url, buffer);
        return buffer;
    } catch {
        return null;
    }
}

const command: Command = {
    commands: ['rollwaifu', 'rw'],
    async execute(ctx: CommandContext) {
        const { gachaService, userData, reply, dbService, sender, chatId, bot } = ctx;
        if (!gachaService) return;

        if (!userData.gacha) userData.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
        
        const lastRoll = userData.gacha.lastRoll || 0;
        const cooldown = getCooldown(lastRoll, COOLDOWN_TIME);
        
        if (cooldown > 0) {
            return await reply(styleText(
                `ꕢ Debes esperar *${formatTime(cooldown)}* para volver a hacer roll.\n\n` +
                `> _*❐ Cooldown: 10 minutos*_`
            ));
        }

        const character = await gachaService.getRandomCharacter();
        if (!character) {
            return await reply(styleText('ꕢ No hay personajes disponibles.'));
        }

        const rarity = Math.floor((character.value || 0) / 400);
        const stars = '⭐'.repeat(Math.min(rarity, 5)) || '⭐';
        const rarityText = rarity >= 5 ? 'Legendario' :
            rarity >= 4 ? 'Mítico' :
                rarity >= 3 ? 'Raro' :
                    rarity >= 2 ? 'Poco Común' : 'Común';
                    
        const sellPrice = Math.floor((character.value || 0) * 0.8);
        
        let message = `ꕣ Nombre » *${character.name}*\n\n`;
        message += `➭ Fuente » *${character.source || 'Desconocido'}*\n`;
        message += `𖧧 Rareza » *${stars} ${rarityText}*\n`;
        message += `苳 Valor » *${formatNumber(character.value || 0)}*\n`;
        message += `₿ Precio » *${formatNumber(sellPrice)}*\n`;
        message += `♛ Dueño » *${character.user ? '@' + character.user.replace(/@.+/, '') : 'Nadie'}*\n\n`;
        
        await dbService.updateUser(sender, {
            'gacha.rolled': character.id,
            'gacha.lastRoll': Date.now()
        });

        message += `> _*❐ Usa #claim en 60 segundos o se perderá!*_`;
        
        if (character.img && character.img.length > 0) {
            try {
                const mentions = character.user ? [character.user] : [];
                const imageBuffer = await Promise.race([
                    fetchImageBuffer(character.img[0]),
                    new Promise<null>(resolve => setTimeout(() => resolve(null), 3000))
                ]);
                
                if (imageBuffer) {
                    await bot.sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: styleText(message),
                        mentions: mentions
                    });
                } else {
                    await bot.sock.sendMessage(chatId, {
                        image: { url: character.img[0] },
                        caption: styleText(message),
                        mentions: mentions
                    });
                }
            } catch (error: any) {
                console.error('[RW] Error sending waifu image:', error);
                await reply(styleText(message), { mentions: character.user ? [character.user] : [] });
            }
        } else {
            await reply(styleText(message), { mentions: character.user ? [character.user] : [] });
        }
    }
};

export default command;
