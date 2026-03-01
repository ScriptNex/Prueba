import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['close', 'open', 'set'],
    tags: ['owner'],
    async execute(ctx: CommandContext) {
        const { isOwner, reply, args, command: cmdName, dbService } = ctx;
        if (!isOwner) return await reply(styleText('ꕢ Solo el owner puede usar este comando.'));
        
        const db = (global as any).db || {};
        if (!db.settings) db.settings = {};

        if (cmdName === 'close' && args[0] === 'system' && args[1] === 'subbots') {
            db.settings.subbotsOpen = false;
            (dbService as any)?.markDirty?.();
            return await reply(styleText(
                `ꕣ *Sistema de SubBots Cerrado*\n\n` +
                `Ya no se permitirán nuevas vinculaciones de subbots.\n\n` +
                `> _Usa #open system subbots para reabrir_`
            ));
        }

        if (cmdName === 'open' && args[0] === 'system' && args[1] === 'subbots') {
            db.settings.subbotsOpen = true;
            (dbService as any)?.markDirty?.();
            return await reply(styleText(
                `ꕣ *Sistema de SubBots Abierto*\n\n` +
                `Se permiten nuevas vinculaciones de subbots.\n\n` +
                `> _Usa #close system subbots para cerrar_`
            ));
        }

        if (cmdName === 'set' && args[0] === 'limit' && args[2] === 'sessions') {
            const limit = parseInt(args[1]);
            if (isNaN(limit) || limit < 0) {
                return await reply(styleText('ꕢ Debes especificar un número válido.\n\n> Ejemplo: #set limit 5 sessions'));
            }
            if (limit === 0) {
                delete db.settings.subbotSessionLimit;
                (dbService as any)?.markDirty?.();
                return await reply(styleText(
                    `ꕣ *Límite de Sesiones Eliminado*\n\n` +
                    `> Ya no hay límite de sesiones para subbots.`
                ));
            }
            db.settings.subbotSessionLimit = limit;
            (dbService as any)?.markDirty?.();
            
            let currentActive = 0;
            if ((global as any).nodeManager) {
                currentActive = (global as any).nodeManager.getTotalSessions();
            } else {
                try {
                    const { jadibotManager } = await import('../../services/external/jadibot.js');
                    currentActive = (jadibotManager as any).subbots.size;
                } catch (e) {
                    // Fallback or ignore
                }
            }
            
            return await reply(styleText(
                `ꕣ *Límite de Sesiones Configurado*\n\n` +
                `> *Límite* » *${limit}*\n` +
                `> *Activos* » *${currentActive}*\n` +
                `> *Disponibles* » *${Math.max(0, limit - currentActive)}*\n\n` +
                `> _Si no hay espacios, los nuevos subbots serán rechazados_`
            ));
        }

        if (cmdName === 'set' && args[0] === 'nodes') {
            const nodeManager = (global as any).nodeManager;
            if (!nodeManager) {
                return await reply(styleText('ꕢ NodeManager no está activo. Solo funciona en el servidor principal.'));
            }
            await nodeManager.checkHealth();
            const nodes = nodeManager.getStatus();
            let message = 'ꕣ *Estado del Cluster*\n\n';
            let totalSessions = 0;
            
            nodes.forEach((n: any) => {
                const icon = n.online ? '🟢' : '🔴';
                const mem = n.memory ? `${n.memory.used}/${n.memory.total}MB` : 'N/A';
                message += `${icon} *${n.id}*${n.local ? ' (local)' : ''}\n`;
                message += `  > Sesiones: *${n.sessions}/${n.maxSessions}*\n`;
                message += `  > RAM: *${mem}*\n\n`;
                totalSessions += n.sessions || 0;
            });
            
            message += `> *Total sesiones:* ${totalSessions}`;
            return await reply(styleText(message));
        }
    }
};

export default command;
