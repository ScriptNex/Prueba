import { extractMentions, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const SHIP_RESULTS = [
    { min: 0, max: 20, emoji: '💔', text: 'No hay compatibilidad... mejor amigos' },
    { min: 21, max: 40, emoji: '😅', text: 'Puede funcionar pero hay trabajo que hacer' },
    { min: 41, max: 60, emoji: '💕', text: 'Hay química, podrían intentarlo' },
    { min: 61, max: 80, emoji: '💖', text: 'Gran compatibilidad, hacen buena pareja' },
    { min: 81, max: 100, emoji: '💗💘💗', text: '¡PAREJA PERFECTA! Amor verdadero' }
];

const command: Command = {
    commands: ['ship', 'love', 'compatibilidad', 'match'],
    async execute(ctx: CommandContext) {
        const { msg, sender, chatId, bot } = ctx;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        let person1 = sender;
        let person2: string | null = null;
        
        if (mentioned.length >= 2) { 
            person1 = mentioned[0]; 
            person2 = mentioned[1]; 
        } else if (mentioned.length === 1) {
            person2 = mentioned[0];
        } else if (quoted) {
            person2 = quoted;
        }
        
        if (!person2) {
            return await ctx.reply(styleText('ꕣ *SHIP - Compatibilidad de Amor*\n\nMenciona a 2 personas o responde a alguien:\n> • #ship @persona1 @persona2\n> • Responder + #ship\n> • #ship @persona'));
        }
        
        const getNumber = (jid: string) => jid.split('@')[0].split(':')[0];
        const num1 = getNumber(person1);
        const num2 = getNumber(person2);
        
        const getNameInternal = async (jid: string) => {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await bot.sock.groupMetadata(chatId);
                    const number = getNumber(jid);
                    const participant = groupMetadata.participants.find(p => getNumber(p.id) === number || (p.lid && getNumber(p.lid) === number));
                    return participant?.notify || participant?.name || number;
                }
            } catch (e) { }
            return getNumber(jid);
        };
        
        const name1 = await getNameInternal(person1);
        const name2 = await getNameInternal(person2);
        
        const today = new Date().toISOString().slice(0, 10);
        const seedValue = parseInt(num1.slice(-4)) + parseInt(num2.slice(-4)) + today.split('-').reduce((acc, curr) => acc + parseInt(curr), 0);
        const percentage = Math.abs((seedValue * 12345) % 101);
        
        const result = SHIP_RESULTS.find(r => percentage >= r.min && percentage <= r.max)!;
        
        const progressBar = (percent: number) => {
            const filled = Math.floor(percent / 10);
            return '❤️'.repeat(filled) + '🖤'.repeat(10 - filled);
        };
        
        const text = `💕 *SHIP - Compatibilidad*\n\n👤 ${name1}\n❤️ + \n👤 ${name2}\n\n${progressBar(percentage)} *${percentage}%* ${result.emoji}\n\n> ${result.text}`.trim();
        
        await bot.sock.sendMessage(chatId, { 
            text: styleText(text), 
            mentions: [person1, person2] 
        }, { quoted: msg });
    }
};

export default command;
