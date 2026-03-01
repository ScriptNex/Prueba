import { OWNER_JID } from '../../config/constants.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['antiprivado', 'antidm', 'antipv'],
    async execute(ctx: CommandContext) {
        const { sender, senderPhone, args, reply, dbService } = ctx;
        const ownerJid = OWNER_JID || '';
        
        const isOwner = sender === ownerJid || 
                        senderPhone === ownerJid.split('@')[0] ||
                        sender.split('@')[0] === ownerJid.split('@')[0];

        if (!isOwner) {
            return await reply(styleText('ꕢ Este comando es solo para el owner.'));
        }

        const action = args[0]?.toLowerCase();
        
        // Access global settings via dbService if possible, or fall back to global.db
        const db = (global as any).db || {};
        const currentStatus = db.settings?.antiPrivado ?? false;

        if (!action || !['on', 'off', 'status'].includes(action)) {
            const statusIcon = currentStatus ? '🟢' : '🔴';
            return await reply(styleText(
                `ꕣ *Anti-Privado*\n\n` +
                `${statusIcon} Estado actual: *${currentStatus ? 'Activado' : 'Desactivado'}*\n\n` +
                `*Uso:*\n` +
                `> #antiprivado on\n` +
                `> #antiprivado off\n\n` +
                `> _Cuando está activado, el bot no responderá comandos en privado (solo en grupos)_`
            ));
        }

        if (!db.settings) db.settings = {};

        if (action === 'on') {
            db.settings.antiPrivado = true;
            (dbService as any)?.markDirty?.();
            return await reply(styleText(
                `ꕣ *Anti-Privado Activado*\n\n` +
                `🟢 El bot ya no responderá comandos en privado.\n` +
                `> Solo funcionará en grupos.\n\n` +
                `> _El owner siempre puede usar comandos en privado_`
            ));
        }

        if (action === 'off') {
            db.settings.antiPrivado = false;
            (dbService as any)?.markDirty?.();
            return await reply(styleText(
                `ꕣ *Anti-Privado Desactivado*\n\n` +
                `🔴 El bot responderá comandos en privado normalmente.`
            ));
        }

        if (action === 'status') {
            const statusIcon = currentStatus ? '🟢' : '🔴';
            return await reply(styleText(
                `ꕣ *Estado Anti-Privado*\n\n` +
                `${statusIcon} Anti-Privado: *${currentStatus ? 'Activado' : 'Desactivado'}*`
            ));
        }
    }
};

export default command;
