import axios from 'axios';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['gemini'],
    tags: ['ai'],
    help: ['gemini <texto>'],
    async execute(ctx: CommandContext) {
        const { text, prefix, command: cmdName, bot, chatId } = ctx;
        if (!text || text.trim().length === 0) {
            return await ctx.reply(styleText(`💬 Ejemplo:\n${prefix + cmdName} ¿qué es un agujero negro?`));
        }
        
        if (ctx.react) await ctx.react("⏳");
        
        try {
            const res = await axios.get(`https://api.zenzxz.my.id/api/ai/gemini?text=${encodeURIComponent(text)}&id=id`);
            const reply = res.data?.data?.response;
            if (!reply) throw new Error("Gemini devolvió un resultado vacío");
            
            await bot.sock.sendMessage(chatId, { text: styleText(reply) }, { quoted: ctx.msg });
        } catch (error: any) {
            console.error("❌ Error en /gemini:", error.message);
            await ctx.reply(styleText("❌ Hubo un problema al consultar Gemini AI."));
        }
        
        if (ctx.react) await ctx.react("✅");
    }
};

export default command;
