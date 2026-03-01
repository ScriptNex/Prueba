import { extractMentions, getRandom, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface Attack {
    name: string;
    emoji: string;
    damage: [number, number];
}

const ATTACKS: Attack[] = [
    { name: 'Golpe crítico', emoji: '👊', damage: [30, 50] },
    { name: 'Patada voladora', emoji: '🦵', damage: [25, 45] },
    { name: 'Kamehameha', emoji: '🔥', damage: [40, 60] },
    { name: 'Golpe de suerte', emoji: '🍀', damage: [10, 70] },
    { name: 'Combo devastador', emoji: '💥', damage: [35, 55] },
    { name: 'Headshot', emoji: '🎯', damage: [45, 65] },
    { name: 'Uppercut', emoji: '🤜', damage: [20, 40] },
    { name: 'Suplex', emoji: '🤼', damage: [30, 50] },
    { name: 'Mordida', emoji: '😬', damage: [15, 35] },
    { name: 'Rasguño de gato', emoji: '🐱', damage: [10, 25] },
    { name: 'Ataque con sartén', emoji: '🍳', damage: [20, 40] },
    { name: 'Bomba nuclear', emoji: '☢️', damage: [50, 80] },
    { name: 'Llaves de judo', emoji: '🥋', damage: [25, 45] },
    { name: 'Ataque psíquico', emoji: '🧠', damage: [30, 50] }
];

const MISS_MESSAGES = ['falló miserablemente y se cayó', 'tropezó con una piedra', 'se olvidó de atacar', 'se distrajo viendo memes', 'tuvo lag mental'];

const command: Command = {
    commands: ['fight', 'pelea', 'pelear', 'batalla', 'vs'],
    async execute(ctx: CommandContext) {
        const { msg, sender, chatId, bot, reply } = ctx;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let opponent = mentioned.length > 0 ? mentioned[0] : quoted;
        
        if (!opponent || opponent === sender) {
            return await reply(styleText('ꕣ *PELEA - Batalla Virtual*\n\nMenciona o responde a alguien:\n> • #fight @persona\n> • Responder + #fight\n\n> ¡No puedes pelear solo!'));
        }
        
        const getNumber = (jid: string) => jid.split('@')[0].split(':')[0];
        
        const getNameInternal = async (jid: string) => {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await bot.sock.groupMetadata(chatId);
                    const number = getNumber(jid);
                    const participant = groupMetadata.participants.find(p => getNumber(p.id) === number);
                    return participant?.notify || participant?.name || number;
                }
            } catch (e) { }
            return getNumber(jid);
        };
        
        const player1 = { jid: sender, name: await getNameInternal(sender), hp: 100 };
        const player2 = { jid: opponent, name: await getNameInternal(opponent), hp: 100 };
        
        let battleLog: string[] = [];
        let turn = 0;
        
        while (player1.hp > 0 && player2.hp > 0 && turn < 10) {
            const attacker = turn % 2 === 0 ? player1 : player2;
            const defender = turn % 2 === 0 ? player2 : player1;
            
            const hitChance = Math.random();
            if (hitChance < 0.15) {
                battleLog.push(`▸ ${attacker.name} ${getRandom(MISS_MESSAGES)}`);
            } else {
                const attack = getRandom(ATTACKS);
                const damage = Math.floor(Math.random() * (attack.damage[1] - attack.damage[0])) + attack.damage[0];
                defender.hp = Math.max(0, defender.hp - damage);
                battleLog.push(`▸ ${attacker.name} usó *${attack.name}* ${attack.emoji} (-${damage}hp)`);
            }
            turn++;
        }
        
        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = player1.hp > player2.hp ? player2 : player1;
        
        const hpBar = (hp: number) => {
            const filled = Math.floor(hp / 10);
            return '🟢'.repeat(filled) + '⚫'.repeat(10 - filled);
        };
        
        const responseText = `⚔️ *BATALLA ÉPICA*\n👤 ${player1.name}\n${hpBar(player1.hp)} ${player1.hp}hp\n⚡ VS ⚡\n👤 ${player2.name}\n${hpBar(player2.hp)} ${player2.hp}hp\n━━━━━━━━━━━━━\n${battleLog.join('\n')}\n━━━━━━━━━━━━━\n🏆 *GANADOR: ${winner.name}*\n💀 Perdedor: ${loser.name}`.trim();
        
        await bot.sock.sendMessage(chatId, { 
            text: styleText(responseText), 
            mentions: [sender, opponent] 
        }, { quoted: msg });
    }
};

export default command;
