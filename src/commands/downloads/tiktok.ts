import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['tiktok', 'ttk', 'tt'],
    async execute(ctx: CommandContext) {
        const { msg: m, chatId, args, bot } = ctx;
        
        const links = m.message?.conversation?.match(/https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/g) || 
                      m.message?.extendedTextMessage?.text?.match(/https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/g) || 
                      args.filter(arg => /https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/.test(arg));
                      
        if (!links || links.length === 0) {
            return await bot.sendMessage(chatId, { 
                text: styleText(`《✧》 *Uso incorrecto del comando*\n\n*Ejemplos:*\n✿ #tiktok https://www.tiktok.com/@user/video/xxx`) 
            });
        }

        const globalAny = global as any;
        const memCheck = globalAny.memoryManager?.canProcessDownload();
        if (memCheck && !memCheck.allowed) {
            return await bot.sendMessage(chatId, { text: styleText(memCheck.message) });
        }

        const linksToProcess = links.slice(0, 3);
        if (links.length > 3) await bot.sendMessage(chatId, { text: styleText('⚠️ Solo se procesarán los primeros 3 enlaces.') });

        for (const link of linksToProcess) {
            try {
                const response = await fetch(`https://www.tikwm.com/api?url=${link}`);
                const result = await response.json();
                const data = result.data;

                if (!data || (!data.play && !data.images?.length)) {
                    await bot.sendMessage(chatId, { text: styleText(`《✧》 No se pudo obtener información del enlace '${link}'`) });
                    continue;
                }

                if (data.images?.length) {
                    const maxImages = Math.min(data.images.length, 5);
                    for (let index = 0; index < maxImages; index++) {
                        const caption = index === 0 ? styleText(`《✧》 *TikTok Download*\n\n✿ *Título:* ${data.title || 'Sin título'}\n\n_Powered By DeltaByte_`) : null;
                        await bot.sendMessage(chatId, { image: { url: data.images[index] }, caption: caption });
                    }
                    if (data.images.length > maxImages) {
                        await bot.sendMessage(chatId, { text: styleText(`⚠️ Solo se mostraron ${maxImages} de ${data.images.length} imágenes.`) });
                    }
                } else if (data.play) {
                    const caption = styleText(`《✧》 *TikTok Download*\n\n✿ *Título:* ${data.title || 'Sin título'}\n\n_Powered By DeltaByte_`);
                    await bot.sendMessage(chatId, { video: { url: data.play }, caption: caption, mimetype: 'video/mp4' });
                }
            } catch (error: any) {
                console.error('Error procesando enlace de TikTok:', error);
                if (error.code === 'ENOSPC' || error.message?.includes('ENOSPC')) {
                    globalAny.memoryManager?.forceCleanup();
                    await bot.sendMessage(chatId, { text: styleText('ꕢ Error de espacio/memoria. Intenta en unos segundos.') });
                    return;
                }
                await bot.sendMessage(chatId, { text: styleText(`《✧》 Error al procesar el enlace: ${link}\n\n💡 *Tip:* Asegúrate de que el video sea público.`) });
            }
        }
    }
};

export default command;
