import { getCooldown, formatTime, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['claim', 'c'],
    async execute(ctx: CommandContext) {
        const COOLDOWN = 30 * 60 * 1000;
        const { userData, gachaService, dbService, sender, reply } = ctx;

        if (!gachaService) return;

        // Ensure gacha data is initialized
        if (!userData.gacha) {
            userData.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
        }

        const cooldown = getCooldown(userData.gacha.lastClaim || 0, COOLDOWN);
        if (cooldown > 0) {
            return await reply(styleText(
                `ꕢ Ya reclamaste un personaje recientemente.\nVuelve en: ${formatTime(cooldown)}`
            ));
        }

        const rolledId = userData.gacha.rolled;
        if (!rolledId) {
            return await reply(styleText('ꕢ Primero debes girar la ruleta con #rollwaifu (#rw) para obtener un personaje.'));
        }

        const CLAIM_WINDOW = 60 * 1000;
        const rollTime = userData.gacha.lastRoll || 0;
        const timeSinceRoll = Date.now() - rollTime;

        if (timeSinceRoll > CLAIM_WINDOW) {
            await dbService.updateUser(sender, { 'gacha.rolled': null });
            return await reply(styleText('ꕢ ¡Demasiado tarde! El personaje escapó porque no lo reclamaste en 60 segundos.'));
        }

        const character = gachaService.getById(rolledId);
        if (!character) {
            await dbService.updateUser(sender, { 'gacha.rolled': null });
            return await reply(styleText('ꕢ El personaje que giraste ya no está disponible.'));
        }

        try {
            await gachaService.claim(sender, character.id);
        } catch (error: any) {
            console.error('Error reclamando personaje en GachaService:', error.message);
            return await reply(styleText(`ꕢ Error: ${error.message}`));
        }

        const newChar = {
            id: character.id,
            name: character.name,
            source: character.source,
            value: character.value,
            img: character.img,
            claimedAt: Date.now()
        };

        const userChars = userData.gacha.characters || [];
        userChars.push(newChar);

        await dbService.updateUser(sender, {
            'gacha.rolled': null,
            'gacha.lastClaim': Date.now(),
            'gacha.characters': userChars
        });

        const senderNumber = sender.split('@')[0];
        await reply(
            styleText(`ꕣ *@${senderNumber}* ha reclamado a *${character.name}* de *${character.source || 'Desconocido'}*`),
            { mentions: [sender] }
        );
    }
};

export default command;
