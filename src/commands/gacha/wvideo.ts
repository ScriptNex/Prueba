import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['wvideo', 'waifuvideo'],
    tags: ['gacha'],
    help: ['wvideo <nombre>'],
    async execute(ctx: CommandContext) {
        const { args, gachaService, bot, chatId, reply, msg } = ctx;
        if (!gachaService) return;

        if (args.length === 0) {
            return await reply(styleText('ꕢ Debes especificar el nombre del personaje.\nUso: #wvideo <personaje>'));
        }

        const query = args.join(' ').toLowerCase();
        const character = gachaService.characters.find(c =>
            c.name?.toLowerCase().includes(query) ||
            (c.alias && c.alias.toLowerCase().includes(query))
        );

        if (!character) {
            return await reply(styleText('ꕢ Personaje no encontrado.'));
        }

        if (!character.vid || character.vid.length === 0) {
            return await reply(styleText(`ꕢ ${character.name} no tiene videos registrados.`));
        }

        const randomVid = character.vid[Math.floor(Math.random() * character.vid.length)];
        await reply(styleText('ꕢ Enviando video...'));
        
        try {
            await bot.sock.sendMessage(chatId, {
                video: { url: randomVid },
                caption: styleText(`🎥 *${character.name}*\n${character.source || ''}`),
                gifPlayback: false
            }, { quoted: msg });
        } catch (error) {
            console.error('[WVIDEO] Error sending video:', error);
            await reply(styleText('ꕢ Error al enviar el video. Puede que el enlace esté caído.'));
        }
    }
};

export default command;
