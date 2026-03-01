import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['sell', 'vender'],
    async execute(ctx: CommandContext) {
        const { isGroup, dbService, chatId, args, gachaService, sender, userData, reply } = ctx;

        if (isGroup) {
            const groupData = dbService.getGroup(chatId);
            if (!groupData.settings?.economy) {
                return await reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }

        if (args.length < 1) {
            return await reply(styleText('ꕢ Uso: #sell <id_personaje>'));
        }

        if (!gachaService) return;

        const characterId = args[0];
        const character = gachaService.getById(characterId);
        
        if (!character) {
            return await reply(styleText(`ꕢ No se encontró ningún personaje con el ID: *${characterId}*`));
        }

        if (character.user !== sender) {
            return await reply(styleText('ꕢ Este personaje no te pertenece.'));
        }

        const sellPrice = Math.floor((character.value || 1000) * 0.8);
        
        try {
            await gachaService.release(sender, characterId);
            
            const userChars = userData.gacha?.characters || [];
            const newChars = userChars.filter((c: any) => c.id !== characterId);
            const currentCoins = userData.economy?.coins || 0;
            const newCoins = currentCoins + sellPrice;

            await dbService.updateUser(sender, {
                'economy.coins': newCoins,
                'gacha.characters': newChars
            });

            await reply(styleText(
                `ꕢ *Venta Exitosa*\n\n` +
                `Vendiste a *${character.name}* por *${sellPrice.toLocaleString()}* coins\n` +
                `Balance: ${newCoins.toLocaleString()} coins`
            ));
        } catch (error: any) {
            await reply(styleText(`ꕢ Error: ${error.message}`));
        }
    }
};

export default command;
