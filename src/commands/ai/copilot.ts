import axios from 'axios';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['copilot'],
    tags: ['ai'],
    help: ['copilot <texto>'],
    async execute(ctx: CommandContext) {
        const { text, reply } = ctx;
        if (!text) return await reply(styleText('ꕢ Por favor escribe algo para hablar con Copilot.\nEjemplo: #copilot Hola, ¿cómo estás?'));
        
        try {
            const response = await axios.get(`https://api.stellarwa.xyz/ai/copilot?text=${encodeURIComponent(text)}&key=stellar-CEpNm0hd`);
            if (!response.data?.status || !response.data?.response) {
                return await reply(styleText('ꕢ No pude obtener una respuesta de Copilot. Inténtalo más tarde.'));
            }
            await reply(styleText(response.data.response));
        } catch (error) {
            console.error('[Copilot] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al conectar con Copilot.'));
        }
    }
};

export default command;
