import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['apk', 'modapk'],
    tags: ['search'],
    help: ['apk <nombre app>'],
    async execute(ctx: CommandContext) {
        const { chatId, bot, prefix, command, text, reply } = ctx;
        const conn = bot?.sock;

        if (!conn) { return await reply(styleText('❌ Error: Conexión no disponible.')) }

        if (!text || !text.trim()) {
            return await reply(styleText(
                `《✧》 *Uso incorrecto del comando*\n\n` +
                `Ejemplo:\n` +
                `✿ ${prefix}${command} whatsapp\n` +
                `✿ ${prefix}${command} spotify`
            ));
        }

        try {
            const searchQuery = text.trim();
            const apiUrl = `https://api.stellarwa.xyz/search/apk?query=${encodeURIComponent(searchQuery)}&key=stellar-zzwTj3LP`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data || !data.status || !data.data) {
                return await reply(styleText(
                    'ꕢ No encontré esa aplicación.\n\n' +
                    '> Intenta con otro nombre.'
                ));
            }

            const appData = data.data;
            const name = appData.name || 'Desconocido';
            const pack = appData.package || 'Desconocido';
            const size = appData.size || 'Desconocido';
            const lastUpdated = appData.lastUpdated || 'Desconocido';
            const banner = appData.banner || '';
            const dlLink = appData.dl;

            if (!dlLink) {
                return await reply(styleText('ꕢ Encontré la app, pero no el link de descarga.'));
            }

            const caption = `ꕣ *APK Found!*\n\n` +
                `> *Nombre* » ${name}\n` +
                `> *Paquete* » ${pack}\n` +
                `> *Tamaño* » ${size}\n` +
                `> *Actualizado* » ${lastUpdated}\n\n` +
                `──────────────────\n` +
                `> _*Por favor espere, se esta enviando el archivo..."_`;

            if (banner) {
                await conn.sendMessage(chatId, {
                    image: { url: banner },
                    caption: styleText(caption)
                });
            } else { await reply(styleText(caption)) }

            await conn.sendMessage(chatId, {
                document: { url: dlLink },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${name}.apk`,
                caption: styleText(`ꕣ Aquí tienes tu APK! \n> ✿ *${name}*`)
            });
        } catch (error: any) {
            logger.error('[APK] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al buscar la aplicación. Inténtalo más tarde.'));
        }
    }
};

export default command;
