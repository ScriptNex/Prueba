import { extractMentions, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['giveallharem', 'giveall'],
    async execute(ctx: CommandContext) {
        const { sender, reply, dbService } = ctx;
        const mentions = extractMentions(ctx);

        if (mentions.length === 0) {
            return await reply(styleText('ꕢ Debes mencionar al usuario.\nUso: #giveall @usuario'));
        }

        const target = mentions[0];
        const userData = dbService.getUser(sender);
        const characters = userData.gacha?.characters || [];

        if (characters.length === 0) {
            return await reply(styleText('ꕢ No tienes personajes en tu harem.'));
        }

        const targetData = dbService.getUser(target);
        if (!targetData.gacha) targetData.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
        if (!targetData.gacha.characters) {
            targetData.gacha.characters = [];
        }

        const count = characters.length;
        targetData.gacha.characters.push(...characters);
        
        await dbService.updateUser(sender, { 'gacha.characters': [] });
        await dbService.updateUser(target, { 'gacha.characters': targetData.gacha.characters });

        await reply(styleText(`ꕣ *Regalo Masivo*\n\n` +
            `Has regalado ${count} personajes a @${target.split('@')[0]}`),
            { mentions: [target] }
        );
    }
};

export default command;
