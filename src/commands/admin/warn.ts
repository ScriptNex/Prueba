import { Command, CommandContext } from '../../types/Command.js';
import { isBotAdmin, isAdmin, extractMentions, styleText } from '../../utils/helpers.js';
import { findParticipant } from '../../utils/permissions.js';

const command: Command = {
    commands: ['warn', 'advertir', 'unwarn', 'delwarn'],
    tags: ['admin'],
    help: ['warn @user [razón]', 'unwarn @user'],
    async execute(ctx: CommandContext) {
        if (!ctx.isGroup) return await ctx.reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) return await ctx.reply(styleText('ꕢ Solo los administradores pueden usar este comando.'));
        
        let targetUser: string | null = null;
        const msg = ctx.msg;
        const contextInfo = msg?.message?.extendedTextMessage?.contextInfo || 
                            msg?.message?.imageMessage?.contextInfo || 
                            msg?.message?.videoMessage?.contextInfo || 
                            msg?.message?.documentMessage?.contextInfo;
        const quoted = contextInfo?.participant;
        const mentioned = extractMentions(ctx);
        
        if (mentioned.length > 0) targetUser = mentioned[0];
        else if (quoted) targetUser = quoted;

        if (!targetUser) return await ctx.reply(styleText('ꕢ Por favor etiqueta o responde al usuario que deseas advertir.'));
        
        if (await isAdmin(ctx.bot.sock, ctx.chatId, targetUser)) {
            return await ctx.reply(styleText('ꕢ No puedo advertir a un administrador.'));
        }
        
        const botId = ctx.bot.sock.user?.id?.split(':')[0];
        if (targetUser.includes(botId!)) return await ctx.reply(styleText('ꕢ No puedo advertirme a mí mismo.'));

        const userData = ctx.dbService.getUser(targetUser);
        if (!userData.warns) userData.warns = 0;

        const isUnwarn = ['unwarn', 'delwarn'].includes(ctx.command);

        if (isUnwarn) {
            if (userData.warns > 0) {
                userData.warns -= 1;
                ctx.dbService.markDirty();
                return await ctx.reply(styleText(`ꕣ *Advertencia Eliminada*\n\n> ⚬ Usuario » @${targetUser.split('@')[0]}\n> ⚬ Advertencias » ${userData.warns}/3`), { mentions: [targetUser] });
            } else {
                return await ctx.reply(styleText('ꕢ El usuario no tiene advertencias para eliminar.'));
            }
        }

        userData.warns += 1;
        ctx.dbService.markDirty();
        
        const reason = ctx.args.filter(arg => !arg.includes('@')).join(' ') || 'Sin razón especificada';
        const warns = userData.warns;

        if (warns >= 3) {
            if (await isBotAdmin(ctx.bot.sock, ctx.chatId)) {
                await ctx.reply(styleText(`ꕣ *LÍMITE ALCANZADO* \n\n> ⚬ Usuario » @${targetUser.split('@')[0]}\n> ▸ Razón Final » ${reason}\n\n> El usuario ha acumulado 3 advertencias y será expulsado.`), { mentions: [targetUser] });
                try {
                    const participant = await findParticipant(ctx.bot.sock, ctx.chatId, targetUser);
                    const phoneJid = participant?.id || targetUser;
                    const jidToKick = phoneJid.includes('@s.whatsapp.net') ? phoneJid : targetUser;
                    await ctx.bot.groupParticipantsUpdate(ctx.chatId, [jidToKick], 'remove');
                    userData.warns = 0;
                    ctx.dbService.markDirty();
                } catch (error) { 
                    await ctx.reply(styleText('ꕢ Error al intentar expulsar al usuario.')); 
                }
            } else {
                await ctx.reply(styleText(`ꕣ *LÍMITE ALCANZADO* \n\n> ⚬ Usuario » @${targetUser.split('@')[0]}\n> Ha acumulado 3 advertencias pero no soy admin para expulsarlo.`), { mentions: [targetUser] });
            }
        } else {
            await ctx.reply(styleText(`ꕣ *Advertencia* \n\n> ⚬ Usuario » @${targetUser.split('@')[0]}\n> ▸ Razón » ${reason}\n> ⚬ Advertencias » ${warns}/3\n\n> _Al llegar a 3 advertencias serás expulsado_`), { mentions: [targetUser] });
        }
    }
};

export default command;
