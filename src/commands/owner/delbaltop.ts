import { styleText, isOwner } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['delbaltop', 'removebaltop'],
    async execute(ctx: CommandContext) {
        const { sender, args, reply, dbService } = ctx;

        if (!isOwner(sender)) {
            return await reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        const targetId = args[0];
        if (!targetId) {
            return await reply(styleText(
                'ꕣ *DELBALTOP - Eliminar de Ranking*\n\n' +
                '> Uso » *#delbaltop* <id_usuario>\n' +
                '> Ejemplo » *#delbaltop* 123456789@s.whatsapp.net\n' +
                '> Ejemplo » *#delbaltop* 123456789@lid\n\n' +
                '> *Nota:* Debes poner el ID exacto (con @s.whatsapp.net o @lid).'
            ));
        }

        try {
            if (!dbService) throw new Error('Database service not available');

            const success = await dbService.deleteUser(targetId);
            if (success) {
                await reply(styleText(`✅ Usuario \`${targetId}\` eliminado de la base de datos y del ranking.`));
            } else {
                await reply(styleText(`⚠️ No se encontró al usuario \`${targetId}\` o no se pudo eliminar.`));
            }
        } catch (error: any) {
            console.error('Error en delbaltop:', error);
            await reply(styleText(`❌ Error al intentar eliminar: ${error.message}`));
        }
    }
};

export default command;
