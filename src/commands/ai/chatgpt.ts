import axios from 'axios';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['chatgpt', 'gpt'],
    async execute(ctx: CommandContext) {
        const { text, reply } = ctx;
        if (!text) return await reply(styleText('ꕢ Por favor escribe algo para hablar con ChatGPT.\nEjemplo: #chatgpt Hola, ¿qué puedes hacer?'));
        
        try {
            const response = await axios.get(`https://api.stellarwa.xyz/ai/chatgpt?text=${encodeURIComponent(text)}&key=stellar-CEpNm0hd`);
            if (!response.data?.status || !response.data?.result) {
                return await reply(styleText('ꕢ No pude obtener una respuesta de ChatGPT. Inténtalo más tarde.'));
            }
            await reply(styleText(response.data.result));
        } catch (error) {
            console.error('[ChatGPT] Error:', error);
            await reply(styleText('ꕢ Error al obtener respuesta de ChatGPT.'));
        }
    }
};

export default command;
