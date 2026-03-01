import { extractMentions, getRandom, styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const CEREMONIES = ['en una capilla con velas flotantes', 'en la playa al atardecer', 'en un castillo medieval', 'en un templo japonés', 'en Las Vegas por Elvis', 'bajo las estrellas', 'en un jardín de rosas', 'en una iglesia gótica', 'en un submarino', 'en la luna (virtualmente)', 'en el metaverso', 'en un McDonalds', 'en el baño del grupo', 'en una montaña rusa'];
const GIFTS = ['un anillo de diamantes', 'un gato como mascota', 'una PS5', 'un viaje a París', 'un taco de regalo', 'un NFT inutilizable', 'unas chanclas de marca', 'un peluche gigante', 'Bitcoin', 'una suscripción a Netflix'];
const FUTURES = ['Tendrán 3 hijos hermosos', 'Serán millonarios juntos', 'Discutirán por el control remoto', 'Se divorciarán en 2 años jaja', 'Vivirán felices para siempre', 'Tendrán un perro llamado "Bot"', 'Pelearán por quién lava los platos', 'Viajarán por el mundo', 'Abrirán un negocio juntos', 'Se mudarán a Japón'];

const command: Command = {
    commands: ['marry', 'casar', 'matrimonio', 'boda', 'casarse'],
    async execute(ctx: CommandContext) {
        const { msg, sender, chatId, bot, reply } = ctx;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let partner = mentioned.length > 0 ? mentioned[0] : quoted;
        
        if (!partner || partner === sender) {
            return await reply(styleText('💒 *MATRIMONIO VIRTUAL*\n\nMenciona o responde a alguien:\n• #marry @persona\n• Responder + #marry\n\n> ¡No puedes casarte solo!'));
        }
        
        const getNumber = (jid: string) => jid.split('@')[0].split(':')[0];
        
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
        
        const name1 = await getNameInternal(sender);
        const name2 = await getNameInternal(partner);
        
        const ceremony = getRandom(CEREMONIES);
        const gift = getRandom(GIFTS);
        const future = getRandom(FUTURES);
        const loveScore = Math.floor(Math.random() * 51) + 50;
        
        const rings = '💍'.repeat(Math.floor(loveScore / 20));
        const textOutput = `💍 *¡BODA VIRTUAL!*\n\n> 👰 ${name1}\n    ❤️ + 💕 + ❤️\n> 🤵 ${name2}\n------------------------------\n> *Lugar* » ${ceremony}\n> *Regalo* » ${gift}\n> *Futuro* » ${future}\n\n${rings} *Amor* » ${loveScore}%\n------------------------------\n✨ Los declaro oficialmente casados virtuales ✨\n> Que vivan felices por siempre~`.trim();
        
        await bot.sock.sendMessage(chatId, { 
            text: styleText(textOutput), 
            mentions: [sender, partner] 
        }, { quoted: msg });
    }
};

export default command;
