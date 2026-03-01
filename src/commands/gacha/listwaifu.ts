import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['listawaifus', 'listwaifus'],
    async execute(ctx: CommandContext) {
        const { gachaService, args, reply } = ctx;
        if (!gachaService) return;

        const characters = gachaService.getAll();
        if (characters.length === 0) {
            return await reply(styleText('✘ No hay waifus registradas.'));
        }

        const page = parseInt(args[0]) || 1;
        const pageSize = 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const totalPages = Math.ceil(characters.length / pageSize);

        if (page > totalPages || page < 1) {
            return await reply(styleText(`✘ Página inválida. Total de páginas: ${totalPages}`));
        }

        const pageCharacters = characters.slice(startIndex, endIndex);
        let listMessage = `✧ *Lista de Waifus* (Página ${page}/${totalPages})\n`;
        listMessage += `Total: ${characters.length} personajes\n\n`;

        pageCharacters.forEach((c) => {
            listMessage += `• Nombre: *${c.name}*\n`;
            listMessage += `• ID: ${c.id}\n`;
            listMessage += `• Dueño: ${c.user ? c.user.split('@')[0] : 'Nadie'}\n`;
            listMessage += `• Valor: ${c.value || 0}\n\n`;
        });

        if (page < totalPages) {
            listMessage += `\nUsa *#listawaifus ${page + 1}* para ver más`;
        }

        await reply(styleText(listMessage.trim()));
    }
};

export default command;
