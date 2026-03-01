import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface MathGame {
    answer: number;
    timer: NodeJS.Timeout;
}

const mathGames = new Map<string, MathGame>();

const command: Command = {
    commands: ['math', 'mates'],
    tags: ['game'],
    help: ['math'],
    async before(ctx: CommandContext) {
        const { chatId, body, sender, dbService } = ctx;
        if (!mathGames.has(chatId)) return;
        
        const game = mathGames.get(chatId)!;
        const answerInput = parseInt(body);
        
        if (!isNaN(answerInput) && answerInput === game.answer) {
            const userData = dbService.getUser(sender);
            const reward = Math.floor(Math.random() * 2000) + 1000;
            
            dbService.updateUser(sender, { 'economy.coins': (userData.economy?.coins || 0) + reward });
            clearTimeout(game.timer);
            mathGames.delete(chatId);
            
            await ctx.reply(styleText(`ꕣ *¡Correcto!* @${sender.split('@')[0]} ganó *${reward}* coins.`), { mentions: [sender] });
        }
    },
    async execute(ctx: CommandContext) {
        const { chatId } = ctx;
        if (mathGames.has(chatId)) return await ctx.reply(styleText('ꕢ Ya hay un juego de matemáticas en curso.'));
        
        const operations = ['+', '-', '*', '/'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        let a: number, b: number, answer: number;
        
        if (op === '+') { 
            a = Math.floor(Math.random() * 50); 
            b = Math.floor(Math.random() * 50); 
            answer = a + b; 
        } else if (op === '-') { 
            a = Math.floor(Math.random() * 50) + 20; 
            b = Math.floor(Math.random() * 20); 
            answer = a - b; 
        } else if (op === '*') { 
            a = Math.floor(Math.random() * 10) + 1; 
            b = Math.floor(Math.random() * 10) + 1; 
            answer = a * b; 
        } else { // '/'
            b = Math.floor(Math.random() * 10) + 1; 
            answer = Math.floor(Math.random() * 10) + 1; 
            a = answer * b; 
        }
        
        const timer = setTimeout(() => { 
            if (mathGames.has(chatId)) { 
                ctx.reply(styleText(`ꕢ *Tiempo agotado* La respuesta era: ${answer}`)); 
                mathGames.delete(chatId); 
            } 
        }, 30000);
        
        mathGames.set(chatId, { answer, timer });
        await ctx.reply(styleText(`ꕢ *Math Game*\n\n> Resuelve: *${a} ${op} ${b}*`));
    }
};

export default command;
