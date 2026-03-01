import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['winfo', 'waifuinfo'],
    tags: ['gacha'],
    help: ['winfo <nombre>'],
    async execute(ctx: CommandContext) {
        const { args, gachaService, reply, replyWithImage } = ctx;
        if (!gachaService) return;

        if (args.length === 0) {
            return await reply(styleText('ꕢ Debes especificar el nombre del personaje.\nUso: #winfo <personaje>'));
        }

        const query = args.join(' ').toLowerCase();
        const character = gachaService.characters.find(c =>
            c.name?.toLowerCase().includes(query) ||
            (c.alias && c.alias.toLowerCase().includes(query))
        );

        if (!character) {
            return await reply(styleText('ꕢ Personaje no encontrado en la base de datos.'));
        }

        const rarityValue = typeof character.value === 'string' ? parseInt(character.value) : (character.value || 0);
        const rarityStars = Math.floor(rarityValue / 400);
        const stars = '⭐'.repeat(Math.min(rarityStars, 5)) || '⭐';
        
        let ownerInfo = 'Nadie';
        if (character.user) {
            ownerInfo = `@${character.user.split('@')[0]}`;
        }

        let message = `ꕣ *Información del Personaje*\n\n`;
        message += `ꕢ *Nombre:* ${character.name}\n`;
        message += `ꕢ *Serie:* ${character.source || 'Desconocido'}\n`;
        message += `ꕢ *Rareza:* ${stars} (${rarityValue})\n`;
        message += `ꕢ *ID:* ${character.id}\n`;
        message += `ꕢ *Dueño:* ${ownerInfo}\n`;
        
        if (character.gender) {
            message += `ꕢ *Género:* ${character.gender}\n`;
        }

        const imageUrl = character.img && character.img.length > 0 ? character.img[0] : null;
        
        if (imageUrl) {
            try {
                await replyWithImage(imageUrl, {
                    caption: styleText(message),
                    mentions: character.user ? [character.user] : []
                });
            } catch (error) {
                await reply(styleText(message), {
                    mentions: character.user ? [character.user] : []
                });
            }
        } else {
            await reply(styleText(message), {
                mentions: character.user ? [character.user] : []
            });
        }
    }
};

export default command;
