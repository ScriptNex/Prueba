import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['harem', 'miswaifu', 'coleccion'],
    async execute(ctx: CommandContext) {
        const { sender, gachaService, args, reply } = ctx;
        
        if (!gachaService) return;

        const userCharacters = gachaService.getByOwner(sender) || [];
        if (userCharacters.length === 0) {
            return await reply(styleText('ꕢ No tienes personajes aún.'));
        }

        let page = 1;
        const fullArgs = args.join(' ').toLowerCase();
        
        if (fullArgs.includes('page=') || fullArgs.includes('pagina=')) {
            const match = fullArgs.match(/(?:page|pagina)=(\d+)/);
            if (match) page = parseInt(match[1]);
        } else if (fullArgs.includes('page ') || fullArgs.includes('pagina ')) {
            const match = fullArgs.match(/(?:page|pagina)\s+(\d+)/);
            if (match) page = parseInt(match[1]);
        } else if (!isNaN(parseInt(args[0]))) {
            page = parseInt(args[0]);
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(userCharacters.length / itemsPerPage);
        page = Math.max(1, Math.min(page, totalPages));

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const charactersToShow = userCharacters.slice(startIndex, endIndex);

        let message = `ꕣ Inventario de Compras\n\n`;
        const userNumber = sender.replace(/@.+/, '');
        
        message += `♟ Usuario » @${userNumber}\n`;
        message += `> ✐ Personajes comprados » ${userCharacters.length}\n\n`;
        message += `禁 Lista de Waifus:\n`;
        
        charactersToShow.forEach((char) => {
            message += `> » ${char.name} (¥${char.value})\n`;
        });
        
        message += `\n> 𖤝 Página › ${page} de ${totalPages}`;

        await reply(styleText(message), { mentions: [sender] });
    }
};

export default command;
