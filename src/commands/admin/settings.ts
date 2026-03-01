import { Command, CommandContext } from '../../types/Command.js';
import { isBotAdmin, isAdmin, styleText } from '../../utils/helpers.js';

const command: Command = {
    commands: ['group', 'grupo', 'settings', 'config'],
    tags: ['admin'],
    help: ['group open', 'group close'],
    async execute(ctx: CommandContext) {
        const { bot, chatId, isGroup, args, sender, reply } = ctx;
        const conn = bot?.sock;

        if (!isGroup) return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        if (!await isAdmin(conn, chatId, sender)) return await reply(styleText('ꕢ Necesitas ser administrador para usar este comando.'));
        if (!await isBotAdmin(conn, chatId)) return await reply(styleText('ꕢ Necesito ser administrador para configurar el grupo.'));

        const action = args[0]?.toLowerCase();

        if (action === 'open' || action === 'abrir') {
            await conn.groupSettingUpdate(chatId, 'announcement', false);
            await reply(styleText('ꕣ *Grupo Abierto* \n\n🔓 Ahora todos los participantes pueden enviar mensajes.'));
        } else if (action === 'close' || action === 'cerrar') {
            await conn.groupSettingUpdate(chatId, 'announcement', true);
            await reply(styleText('ꕣ *Grupo Cerrado* \n\n🔒 Solo los administradores pueden enviar mensajes.'));
        } else {
            await reply(styleText('⚙️ *Configuración de Grupo* \n\n• #group _open_ (Abrir grupo)\n• #group _close_ (Cerrar grupo)'));
        }
    }
};

export default command;
