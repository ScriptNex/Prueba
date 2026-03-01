import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['ping', 'p'],
    tags: ['tools'],
    help: ['ping - Verifica la latencia del bot'],
    async execute(ctx: CommandContext) {
        const start = Date.now();
        const { reply, bot, chatId } = ctx;

        const msg: any = await reply(styleText('✿ Calculando ping...'));
        const latency = Date.now() - start;

        await bot?.sock.sendMessage(chatId, {
            text: styleText(
                `✿ *Pong!*\n\n` +
                `> ⚬ Latencia: *${latency}ms*\n` +
                `> ⚬ Estado: ${latency < 100 ? 'Excelente' : latency < 300 ? 'Bueno' : 'Lento'}`
            ),
            edit: msg.key
        });
    }
};

export default command;
