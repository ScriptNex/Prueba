import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const OWNER_NUMBER = '573115434166';

const command: Command = {
    commands: ['resetwaifus', 'reiniciarwaifus'],
    async execute(ctx: CommandContext) {
        const { sender, gachaService, dbService, reply } = ctx;
        const senderNumber = sender.split('@')[0].split(':')[0];

        if (senderNumber !== OWNER_NUMBER) {
            return await reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        try {
            if (!gachaService) return;

            const characters = gachaService.getAll();
            if (characters.length === 0) {
                return await reply(styleText('✘ No hay waifus registradas.'));
            }

            gachaService.resetAllCharacters();

            // Reset characters in all users
            const users = dbService.getUsers() || {};
            for (const userId in users) {
                const userData = users[userId];
                if (userData.gacha && userData.gacha.characters) {
                    userData.gacha.characters = [];
                }
            }

            dbService.markDirty();
            await reply(styleText('✅ Todas las waifus han sido reiniciadas. Ahora nadie las posee.'));
        } catch (error: any) {
            await reply(styleText(`✘ Error: ${error.message}`));
        }
    }
};

export default command;
