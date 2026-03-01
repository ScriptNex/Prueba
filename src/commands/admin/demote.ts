import { Command, CommandContext } from '../../types/Command.js';
import { isAdmin, isBotAdmin, extractMentions, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['demote'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        
        const botAdmin = await isBotAdmin(ctx.bot.sock, ctx.chatId);
        if (!botAdmin) return await ctx.reply(styleText('ꕢ Necesito ser administrador para degradar usuarios.'));
        
        const mentions = extractMentions(ctx);
        if (mentions.length === 0) return await ctx.reply(styleText('ꕢ Debes mencionar al usuario a degradar.'));
        
        try {
            const groupMetadata = await ctx.bot.groupMetadata(ctx.chatId);
            const participantIds: string[] = [];
            
            for (const mentionedUser of mentions) {
                const phoneNumber = mentionedUser.split('@')[0].split(':')[0];
                const participant = groupMetadata.participants.find((p: any) => p.id.split('@')[0].split(':')[0] === phoneNumber);
                if (participant) participantIds.push(participant.id);
            }

            if (participantIds.length === 0) {
                return await ctx.reply(styleText('ꕢ No se encontró al usuario mencionado en el grupo.'));
            }

            await ctx.bot.groupParticipantsUpdate(ctx.chatId, participantIds, 'demote');
            await ctx.reply(styleText(`ꕣ @${participantIds[0].split('@')[0]} ya no es administrador.`), { mentions: participantIds });
        } catch (error: any) {
            console.error('[AdminDemote] Error:', error);
            await ctx.reply(styleText('ꕢ Error al degradar al usuario: ' + error.message));
        }
    }
};

export default command;
