import { styleText, getName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['wanted', 'sebusca'],
    tags: ['fun'],
    help: ['wanted @usuario', 'wanted (responde a mensaje)'],
    async execute(ctx: CommandContext) {
        const { msg, bot, chatId, sender } = ctx;

        let targetJid: string;
        const msgAny: any = msg;
        const mentionedJid = msgAny.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            targetJid = mentionedJid[0];
        } else if (msgAny.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = msgAny.message.extendedTextMessage.contextInfo.participant;
        } else {
            targetJid = sender;
        }

        const displayName = await getName(bot.sock, chatId, targetJid);

        let profilePicUrl: string;
        try {
            profilePicUrl = await bot.sock.profilePictureUrl(targetJid, 'image');
        } catch {
            profilePicUrl = 'https://i.ibb.co/3Fh9V6p/avatar-contact.png';
        }

        try {
            const wantedUrl = `https://api.popcat.xyz/wanted?image=${encodeURIComponent(profilePicUrl)}`;
            await bot.sock.sendMessage(chatId, {
                image: { url: wantedUrl },
                caption: styleText(`🚨 *SE BUSCA* 🚨\n\n⚠️ Usuario: ${displayName}\n💰 Recompensa: 1,000,000 coins`),
                mentions: [targetJid]
            }, { quoted: msg });
        } catch (error) {
            console.error('Error en wanted:', error);
            await ctx.reply(styleText('ꕤ Error al crear el poster. Intenta de nuevo.'));
        }
    }
};

export default command;
