import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['wimage', 'waifuimage'],
    tags: ['gacha'],
    help: ['wimage <nombre>'],
    async execute(ctx: CommandContext) {
        const { args, gachaService, reply, replyWithImage } = ctx;
        if (!gachaService) return;

        if (args.length === 0) {
            return await reply(styleText('ꕢ Debes especificar el nombre del personaje.\nUso: #wimage <personaje>'));
        }

        const query = args.join(' ').toLowerCase();
        const character = gachaService.characters.find(c =>
            c.name?.toLowerCase().includes(query) ||
            (c.alias && c.alias.toLowerCase().includes(query))
        );

        if (!character) {
            return await reply(styleText('ꕢ Personaje no encontrado.'));
        }

        if (!character.img || character.img.length === 0) {
            return await reply(styleText(`ꕢ ${character.name} no tiene imágenes registradas.`));
        }

        const randomImg = character.img[Math.floor(Math.random() * character.img.length)];
        
        try {
            await replyWithImage(randomImg, {
                caption: styleText(`📸 *${character.name}*\n${character.source || ''}`)
            });
        } catch (error: any) {
            console.error('[WIMAGE] Error sending waifu image:', error);
            const fallbackMsg = `📸 *${character.name}*\n${character.source || ''}\n\nLink: ${randomImg}`;
            await reply(styleText(fallbackMsg));
        }
    }
};

export default command;
