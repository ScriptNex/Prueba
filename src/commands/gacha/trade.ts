import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface PendingTrade {
    initiator: string;
    targetUser: string;
    initiatorChar: any;
    targetChar: any;
    timestamp: number;
}

const pendingTrades = new Map<string, PendingTrade>();

const command: Command = {
    commands: ['trade', 'intercambio', 'aceptar'],
    tags: ['gacha'],
    help: ['trade <mi_personaje> + <su_personaje> + @usuario', 'aceptar'],
    async execute(ctx: CommandContext) {
        const { chatId, sender, args, text, gachaService, command, dbService, reply } = ctx;

        if (!gachaService) return;

        if (command === 'aceptar') {
            const trade = pendingTrades.get(chatId);
            if (!trade) {
                return await reply(styleText('ꕢ No hay ningún intercambio pendiente en este chat.'));
            }
            if (trade.targetUser !== sender) {
                return await reply(styleText('ꕢ Este intercambio no es para ti.'));
            }

            const { initiator, targetUser, initiatorChar, targetChar } = trade;

            const char1 = gachaService.getById(initiatorChar.id);
            const char2 = gachaService.getById(targetChar.id);

            if (!char1 || !char2 || char1.user !== initiator || char2.user !== targetUser) {
                pendingTrades.delete(chatId);
                return await reply(styleText('ꕢ El intercambio falló porque uno de los personajes ya no pertenece al dueño original o no existe.'));
            }

            try {
                await gachaService.transferCharacter(initiatorChar.id, targetUser);
                await gachaService.transferCharacter(targetChar.id, initiator);

                const user1Data = dbService.getUser(initiator);
                const user2Data = dbService.getUser(targetUser);

                if (!user1Data.gacha) user1Data.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
                if (!user1Data.gacha.characters) user1Data.gacha.characters = [];

                if (!user2Data.gacha) user2Data.gacha = { characters: [], rolled: null, lastClaim: 0, lastRoll: 0 };
                if (!user2Data.gacha.characters) user2Data.gacha.characters = [];

                const idx1 = user1Data.gacha.characters.findIndex((c: any) => c.id === initiatorChar.id);
                if (idx1 !== -1) user1Data.gacha.characters.splice(idx1, 1);
                user1Data.gacha.characters.push({ id: targetChar.id, name: targetChar.name, claimedAt: Date.now() });

                const idx2 = user2Data.gacha.characters.findIndex((c: any) => c.id === targetChar.id);
                if (idx2 !== -1) user2Data.gacha.characters.splice(idx2, 1);
                user2Data.gacha.characters.push({ id: initiatorChar.id, name: initiatorChar.name, claimedAt: Date.now() });

                await dbService.updateUser(initiator, { 'gacha.characters': user1Data.gacha.characters });
                await dbService.updateUser(targetUser, { 'gacha.characters': user2Data.gacha.characters });
                await gachaService.save();

                pendingTrades.delete(chatId);

                return await reply(styleText(
                    `ꕣ *Intercambio Exitoso* \n\n` +
                    `✧ @${initiator.split('@')[0]} recibió a *${targetChar.name}*\n` +
                    `✧ @${targetUser.split('@')[0]} recibió a *${initiatorChar.name}*`),
                    { mentions: [initiator, targetUser] }
                );
            } catch (error: any) {
                return await reply(styleText(`ꕢ Error durante el intercambio: ${error.message}`));
            }
        }

        const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            return await reply(styleText(
                `ꕢ *Uso incorrecto*\n\n` +
                `Formato: #trade <mi_personaje> <su_personaje> @usuario\n` +
                `Ejemplo: #trade Rem Emilia @usuario`
            ));
        }

        const targetUser = mentioned[0];
        if (targetUser === sender) {
            return await reply(styleText('ꕢ No puedes intercambiar contigo mismo.'));
        }

        const cleanText = text.replace(/@\d+/g, '').trim().replace(/^#?\w+\s+/, '');
        const myChars = gachaService.getByOwner(sender);

        // Sort by name length descending to match longest name first
        myChars.sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

        let myChar: any = null;
        let theirCharName = '';

        for (const char of myChars) {
            if (!char.name) continue;
            const regex = new RegExp(`^${char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s+|$)`, 'i');
            if (regex.test(cleanText)) {
                myChar = char;
                theirCharName = cleanText.slice(char.name.length).trim();
                break;
            }
        }

        if (!myChar) {
            return await reply(styleText(`ꕢ No encontré ningún personaje tuyo al inicio del mensaje.\nAsegúrate de escribir el nombre tal cual lo tienes.`));
        }

        if (!theirCharName) {
            return await reply(styleText('ꕢ Debes escribir el nombre del personaje que quieres recibir después del tuyo.'));
        }

        const theirChars = gachaService.getByOwner(targetUser);
        const theirChar = theirChars.find(c => c.name?.toLowerCase() === theirCharName.toLowerCase());

        if (!theirChar) {
            return await reply(styleText(`ꕢ @${targetUser.split('@')[0]} no tiene ningún personaje llamado "${theirCharName}".`), { mentions: [targetUser] });
        }

        const timestamp = Date.now();
        pendingTrades.set(chatId, {
            initiator: sender,
            targetUser: targetUser,
            initiatorChar: myChar,
            targetChar: theirChar,
            timestamp: timestamp
        });

        setTimeout(() => {
            const currentTrade = pendingTrades.get(chatId);
            if (currentTrade && currentTrade.timestamp === timestamp) {
                pendingTrades.delete(chatId);
            }
        }, 120000);

        await reply(styleText(
            `ꕣ *Solicitud de Intercambio* \n\n` +
            `✧ @${sender.split('@')[0]} ofrece: *${myChar.name}*\n` +
            `✧ Para: @${targetUser.split('@')[0]} por: *${theirChar.name}*\n\n` +
            `> _*Responde con *#aceptar* para confirmar el intercambio.*_`),
            { mentions: [sender, targetUser] }
        );
    }
};

export default command;
