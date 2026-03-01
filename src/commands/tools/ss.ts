import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['ss', 'screenshot', 'captura'],
    tags: ['tools'],
    help: ['ss <url>'],
    async execute(ctx: CommandContext) {
        const { bot, msg, text, chatId, reply } = ctx;
        if (!text) {
            return await reply(styleText('ꕢ Ingresa una URL para tomar la captura.'));
        }

        let url = '';
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            url = urlMatch[0];
        } else {
            const cleanText = text.replace(/^[#\/.]\w+\s*/, '').trim();
            const parts = cleanText.split(/\s+/);
            url = parts[0];
            if (url && !url.startsWith('http')) {
                url = `http://${url}`;
            }
        }

        if (!url || url === 'http://') {
            return await reply(styleText('ꕢ URL inválida.'));
        }

        try {
            await reply(styleText('ꕢ Tomando captura...'));
            const apiUrl = `https://api.stellarwa.xyz/tools/ssweb?url=${encodeURIComponent(url)}&key=stellar-20J4F8hk`;

            await bot?.sock.sendMessage(chatId, {
                image: { url: apiUrl },
                caption: styleText(`> *Screenshot de* » ${url}`)
            }, { quoted: msg as any });
        } catch (error) {
            logger.error('Error en ss:', error);
            await reply(styleText('ꕢ Error al tomar la captura. Verifica la URL.'));
        }
    }
};

export default command;
