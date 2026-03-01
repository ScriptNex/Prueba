import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['ainfo', 'animeinfo'],
    tags: ['gacha'],
    help: ['ainfo <nombre del anime>'],
    async execute(ctx: CommandContext) {
        const { text, gachaService, reply } = ctx;

        if (!text) {
            return await reply('ꕢ Debes especificar el nombre de un anime.\nEjemplo: #ainfo Naruto');
        }
        
        if (!gachaService) return;

        const cleanText = text.replace(/^#?\w+\s+/, '').trim();
        const searchTerm = cleanText.toLowerCase();

        const charactersFromAnime = gachaService.characters.filter(char => {
            const hasSource = char.source && char.source.toLowerCase().includes(searchTerm);
            return hasSource;
        });

        if (charactersFromAnime.length === 0) {
            return await reply(styleText(`ꕢ No se encontraron personajes del anime "${cleanText}" en el gacha.`));
        }

        charactersFromAnime.sort((a, b) => (b.value || 0) - (a.value || 0));

        let message = `🎌 *Personajes de "${cleanText}"*\n\n`;
        message += `📊 Total: ${charactersFromAnime.length} personajes\n\n`;

        const rarityGroups: Record<number, any[]> = {};
        charactersFromAnime.forEach(char => {
            const rarity = char.value || 0;
            if (!rarityGroups[rarity]) {
                rarityGroups[rarity] = [];
            }
            rarityGroups[rarity].push(char);
        });

        const rarities = Object.keys(rarityGroups).map(Number).sort((a, b) => b - a);

        for (const rarity of rarities) {
            const chars = rarityGroups[rarity];
            message += `✨ *Rareza ${rarity}:*\n`;
            chars.forEach(char => {
                message += `• ${char.name} (ID: ${char.id})\n`;
            });
            message += '\n';
        }

        message += `━━━━━━━━━━━━━━━\n`;
        message += `💡 Usa #winfo <nombre> para más detalles`;

        await reply(styleText(message));
    }
};

export default command;
