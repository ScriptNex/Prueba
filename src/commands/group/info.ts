import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['gp', 'gpinfo', 'grupoinfo', 'groupinfo'],
    tags: ['group'],
    help: ['gp'],
    async execute(ctx: CommandContext) {
        const { chatId, isGroup, reply, dbService, bot } = ctx;
        if (!isGroup) {
            return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }

        try {
            const groupMetadata = await bot.sock.groupMetadata(chatId);
            const groupData = dbService.getGroup(chatId);
            const settings = groupData?.settings || {};

            const statusIcon = (enabled: boolean) => enabled ? '✅' : '❌';
            const participants = groupMetadata.participants || [];
            const admins = participants.filter(p => p.admin).length;
            const members = participants.length;

            const createdAt = groupMetadata.creation
                ? new Date(groupMetadata.creation * 1000).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : 'Desconocida';

            const message = styleText(
                `ꕢ *Informacion Del Grupo*\n\n` +
                `> ┌───────────\n` +
                `> │ ❀ *Nombre »* ${groupMetadata.subject || 'Sin nombre'}\n` +
                `> │ ❀ *ID »* ${chatId.split('@')[0]}\n` +
                `> │ ❀ *Miembros »* ${members}\n` +
                `> │ ❀ *Admins »* ${admins}\n` +
                `> │ ❀ *Creado »* ${createdAt}\n` +
                `> ├───────────\n` +
                `> │ ❀ *SISTEMAS DEL BOT*\n` +
                `> ├───────────\n` +
                `> │ ❀ *Welcome »* ${statusIcon(settings.welcome)}\n` +
                `> │ ❀ *Goodbye »* ${statusIcon(settings.goodbye)}\n` +
                `> │ ❀ *Antilink »* ${statusIcon(settings.antilink)}\n` +
                `> │ ❀ *Economy »* ${statusIcon(settings.economy)}\n` +
                `> │ ❀ *NSFW »* ${statusIcon(settings.nsfw)}\n` +
                `> │ ❀ *Alerts »* ${statusIcon(settings.alerts)}\n` +
                `> └─────────\n\n` +
                `> *Descripción:*\n` +
                `${groupMetadata.desc || '_Sin descripción_'}`
            );

            try {
                const ppUrl = await bot.sock.profilePictureUrl(chatId, 'image');
                if (ppUrl) {
                    await bot.sock.sendMessage(chatId, {
                        image: { url: ppUrl },
                        caption: message
                    });
                    return;
                }
            } catch (e) { }

            await reply(message);
        } catch (error) {
            console.error('[GroupInfo] Error:', error);
            await reply(styleText('ꕢ *Error*\n\n> No se pudo obtener la información del grupo.'));
        }
    }
};

export default command;
