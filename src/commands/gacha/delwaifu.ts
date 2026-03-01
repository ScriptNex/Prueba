import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['delwaifu', 'delchar'],
    async execute(ctx: CommandContext) {
        const { chatId, sender, args, userData, dbService, bot, reply } = ctx;

        if (args.length === 0) {
            return await reply(styleText('ꕢ Debes especificar el nombre del personaje.\nUso: #delwaifu <personaje>'));
        }

        const charName = args.join(' ');
        const characters = userData.gacha?.characters || [];
        const charIndex = characters.findIndex((c: any) =>
            c.name.toLowerCase() === charName.toLowerCase()
        );

        if (charIndex === -1) {
            return await reply(styleText('ꕢ No tienes ese personaje en tu harem.'));
        }

        const character = characters[charIndex];
        characters.splice(charIndex, 1);
        
        await dbService.updateUser(sender, { 'gacha.characters': characters });

        await reply(styleText(`ꕣ Has eliminado a ${character.name} de tu harem.`));
    }
};

export default command;
