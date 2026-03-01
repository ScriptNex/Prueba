import axios from 'axios';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['speak', 'hablar', 'decir'],
    async execute(ctx: CommandContext) {
        const { bot, msg, args, reply, chatId } = ctx;
        const text = args.join(' ');

        if (!text) {
            return await reply(styleText('ꕢ Por favor escribe lo que quieres que diga.\nEjemplo: #speak Hola mundo'));
        }

        await reply(styleText('ꕢ Generando audio...'));

        try {
            const API_KEY = 'sk_3daf1763ae4a57b826d55d7d85734ca29a8938851cc0e704';
            const VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
            const response = await axios({
                method: 'post',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                data: {
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                },
                responseType: 'arraybuffer'
            });

            const audioBuffer = Buffer.from(response.data);

            await bot?.sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: msg as any });
        } catch (error: any) {
            logger.error('Error ElevenLabs:', error.response?.data || error.message);
            await reply(styleText('ꕢ Error al generar el audio. Verifica la API Key o intenta más tarde.'));
        }
    }
};

export default command;
