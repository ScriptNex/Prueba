import { extractMentions, styleText } from '../../utils/helpers.js';
import { normalizeUserId } from '../../utils/permissions.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['regalar', 'give'],
    async execute(ctx: CommandContext) {
        const { args, gachaService, dbService, sender, userData, reply } = ctx;
        const mentions = extractMentions(ctx);

        if (mentions.length === 0 || args.length < 1) {
            return await reply(styleText('ꕢ Uso: #give <id_personaje> @usuario\no\n#give @usuario <id_personaje>'));
        }

        if (!gachaService) return;

        const target = mentions[0];
        const characterId = args.find(arg => !arg.includes('@'));

        if (!characterId) {
            return await reply(styleText('ꕢ Debes proporcionar el ID del personaje.'));
        }

        const character = gachaService.getById(characterId);
        if (!character) {
            return await reply(styleText(`ꕢ No se encontró ningún personaje con el ID: *${characterId}*`));
        }

        // Normalize IDs for comparison
        const normalizedOwner = normalizeUserId(character.user || '');
        const normalizedSender = normalizeUserId(sender);

        if (normalizedOwner !== normalizedSender) {
            return await reply(styleText('ꕢ Este personaje no te pertenece.'));
        }

        const targetUser = dbService.getUser(target);

        try {
            const { character: transferredChar } = await gachaService.transferCharacter(characterId, target);

            // Ensure target has gacha data initialized
            if (!targetUser.gacha) targetUser.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
            if (!targetUser.gacha.characters) targetUser.gacha.characters = [];

            targetUser.gacha.characters.push({
                id: transferredChar.id,
                name: transferredChar.name,
                claimedAt: Date.now()
            });

            // Ensure sender has gacha data initialized
            if (!userData.gacha) userData.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
            if (!userData.gacha.characters) userData.gacha.characters = [];

            const charIndex = userData.gacha.characters.findIndex((c: any) => c.id === characterId);
            if (charIndex !== -1) {
                userData.gacha.characters.splice(charIndex, 1);
            }

            dbService.markDirty();
            await dbService.save();
            await gachaService.save();

            await reply(styleText(
                `ꕣ *Regalo Enviado*\n\n` +
                `Has regalado a *${transferredChar.name}* (ID: ${transferredChar.id}) a @${target.split('@')[0]}`),
                { mentions: [target] }
            );
        } catch (error: any) {
            await reply(styleText(`ꕢ Error: ${error.message}`));
        }
    }
};

export default command;
