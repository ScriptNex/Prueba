import { findParticipant, normalizeUserId } from '../../utils/permissions.js';
import { extractMentions, styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['dar'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, isGroup, reply, sender, args, gachaService, dbService } = ctx;
        const mentions = extractMentions(ctx);
        
        if (mentions.length === 0 || args.length < 1) {
            return await reply(styleText('✘ Debes mencionar a un usuario.\n\nEjemplo:\n*#dar @usuario id123*'));
        }

        if (!gachaService) return;

        // Resolve LID to Phone JID
        let target = mentions[0];
        if (isGroup) {
            const participant = await findParticipant(bot, chatId, target);
            if (participant) {
                target = participant.id; // Correct Phone JID
            }
        }
        target = normalizeUserId(target) as string; // Ensure clean format

        const characterId = args.find(arg => !arg.includes('@'));
        if (!characterId) {
            return await reply(styleText('✘ Debes proporcionar el ID del personaje.\n\nEjemplo:\n*#dar @usuario id123*'));
        }

        try {
            const character = gachaService.getById(characterId);
            if (!character) {
                return await reply(styleText(`✘ No se encontró ningún personaje con el ID: *${characterId}*`));
            }

            const previousOwner = character.user;
            const transferResult = await gachaService.transferCharacter(characterId, target);
            const transferredChar = transferResult.character;

            const targetUser = await dbService.getUser(target);
            if (!targetUser.gacha) targetUser.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
            if (!targetUser.gacha.characters) {
                targetUser.gacha.characters = [];
            }

            targetUser.gacha.characters.push({
                id: transferredChar.id,
                name: transferredChar.name,
                claimedAt: Date.now()
            });

            dbService.markDirty();
            await dbService.save();
            await gachaService.save();

            // Get readable names instead of raw JIDs
            const targetName = await getName(bot, chatId, target);
            let confirmMessage = `✧ *${character.name}* (ID: ${character.id}) ha sido entregado a *${targetName}* exitosamente.`;
            
            if (previousOwner && previousOwner !== sender) {
                confirmMessage += `\n\n⚠️ Nota: El personaje pertenecía a @${previousOwner.split('@')[0]}`;
            }

            await reply(styleText(confirmMessage), {
                mentions: [target, previousOwner].filter(Boolean) as string[]
            });
        } catch (error: any) {
            await reply(styleText(`✘ Error al dar el personaje: ${error.message}`));
        }
    }
};

export default command;
