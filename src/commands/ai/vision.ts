import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { downloadMediaMessage } from 'baileys';
import { CLOUDFLARE_CONFIG } from '../../config/cloudflare.js';
import { Command, CommandContext } from '../../types/Command.js';
import { globalLogger as logger } from '../../utils/Logger.js';

const { ACCOUNT_ID, API_TOKEN, VISION_MODEL, MAX_TOKENS } = CLOUDFLARE_CONFIG;

const command: Command = {
    commands: ['vision', 'analyze', 'whatisthis', 'describe', 'img'],
    async execute(ctx: CommandContext) {
        const { bot, msg, text, chatId, args } = ctx;
        const sock = bot.sock || (bot as any).ws;
        
        try {
            const prompt = text || args.join(' ') || 'Describe esta imagen en detalle';
            let imageMessage = msg.message?.imageMessage;
            
            if (!imageMessage && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                imageMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            
            if (!imageMessage) {
                return await sock.sendMessage(chatId, { 
                    text: styleText(`《✿》 *Vision AI - Análisis de Imágenes* 《✧》\n\nEnvía una imagen con tu pregunta o responde a una imagen.\n\n*Ejemplos de uso:*\n✿ #vision ¿Qué ves en esta imagen?\n✿ #vision Describe esta foto en detalle\n✿ #vision ¿Qué emociones transmite?\n✿ #vision ¿Qué texto tiene esta imagen?\n✿ #vision ¿Cuántas personas hay?\n\n> *Tip:* Puedes hacer cualquier pregunta sobre la imagen.\n\n> *Modelo:* ${VISION_MODEL}`) 
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, { text: styleText('《✿》 Analizando imagen con IA...') }, { quoted: msg });
            
            let imageBuffer;
            try {
                const messageToDownload = msg.message?.imageMessage ? msg : {
                    message: { imageMessage: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage },
                    key: msg.message?.extendedTextMessage?.contextInfo?.stanzaId ? {
                        remoteJid: msg.key.remoteJid,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    } : msg.key
                };
                imageBuffer = await downloadMediaMessage(messageToDownload as any, 'buffer', {}, { 
                    reuploadRequest: sock.updateMediaMessage,
                    logger: sock.logger
                });
            } catch (downloadError) {
                console.error('[Vision] Error descargando imagen:', downloadError);
                return await sock.sendMessage(chatId, { 
                    text: styleText('《✿》 Error al descargar la imagen.\n\n💡 *Tip:* Intenta enviar la imagen nuevamente.') 
                }, { quoted: msg });
            }
            
            if (!imageBuffer) return await sock.sendMessage(chatId, { text: styleText('《✿》 No se pudo obtener la imagen.') }, { quoted: msg });
            
            const imageArray = Array.from(new Uint8Array(imageBuffer));
            let analysis;
            
            try {
                const response = await axios.post(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${VISION_MODEL}`, {
                    image: imageArray,
                    prompt: prompt,
                    max_tokens: MAX_TOKENS
                }, {
                    headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' }
                });
                analysis = response.data?.result?.description || response.data?.result?.response || response.data?.description || JSON.stringify(response.data);
            } catch (aiError: any) {
                console.error('[Vision] Error con Cloudflare AI:', aiError);
                const errorMsg = aiError.response?.data?.errors?.[0]?.message || aiError.message;
                return await sock.sendMessage(chatId, { 
                    text: styleText(`《✿》 Error al analizar la imagen con Cloudflare AI.\n\n💡 *Posibles causas:*\n✿ Credenciales inválidas (Account ID o API Token)\n✿ Modelo no disponible o sin permisos\n✿ Límite de uso alcanzado\n✿ Imagen muy grande o formato no soportado\n\n❌ Error: ${errorMsg}`) 
                }, { quoted: msg });
            }
            
            const responseText = `╔═══《 VISION AI 》═══╗\n║\n║ ✦ *Pregunta:* ${prompt}\n║ ✦ *Modelo:* LLaVA 1.6 34B\n║ ✦ *Powered by:* Cloudflare Workers AI\n║\n╚═════════════════════════╝\n\n*Análisis:*\n${analysis}\n\n> _*By Soblend | Development Studio Creative*_`;
            await sock.sendMessage(chatId, { text: styleText(responseText) }, { quoted: msg });
        } catch (error) {
            console.error('[Vision] Error general:', error);
            await sock.sendMessage(chatId, { text: styleText('《✿》 Ocurrió un error inesperado al analizar la imagen.\n\n💡 *Tip:* Intenta con una imagen más pequeña o diferente.') }, { quoted: msg });
        }
    }
};

export default command;
