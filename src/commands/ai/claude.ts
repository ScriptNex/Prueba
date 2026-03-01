import axios from 'axios';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['claude'],
    tags: ['ai'],
    help: ['claude <texto>'],
    async execute(ctx: CommandContext) {
        const { text, reply } = ctx;
        if (!text) return await reply(styleText('ꕢ Por favor escribe algo para hablar con Claude.\nEjemplo: #claude Hola, ¿qué puedes hacer?'));
        
        try {
            const response = await axios.get(`https://mayapi.ooguy.com/ai-claude?q=${encodeURIComponent(text)}&apikey=may-2c29b3db`);
            if (!response.data?.status || !response.data?.result) {
                return await reply(styleText('ꕢ No pude obtener una respuesta de Claude. Inténtalo más tarde.'));
            }
            await reply(styleText(response.data.result));
        } catch (error) {
            console.error('[Claude] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al conectar con Claude.'));
        }
    }
};

export default command;
