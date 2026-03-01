import { jadibotManager } from '../../services/external/jadibot.js';
import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['bots', 'sockets'],
    tags: ['tools'],
    help: ['bots', 'sockets'],

    async execute(ctx: CommandContext) {
        const { bot, chatId, isGroup, prembotManager, args, reply, dbService } = ctx;

        if (args[0] === 'complete') {
            try {
                const fs = await import('fs');
                const path = await import('path');

                const subbotsDir = path.join(process.cwd(), 'subbots');
                const prembotsDir = path.join(process.cwd(), 'prembots');

                const getDirCount = (dir: string) => {
                    try {
                        return fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory()).length;
                    } catch {
                        return 0;
                    }
                };

                const subbotsList = (jadibotManager as any).getSubbots();
                const prembotsList = Array.from(prembotManager?.prembots.entries() || []);
                const activeSubbots = subbotsList.length;
                const activePrembots = prembotsList.length;

                const regSubbots = getDirCount(subbotsDir);
                const regPrembots = getDirCount(prembotsDir);

                const db = (global as any).db || {};
                const systemOpen = db.settings?.subbotsOpen !== false;
                const sessionLimit = db.settings?.subbotSessionLimit;
                const systemIcon = systemOpen ? '🟢' : '🔴';

                let message = 'ꕣ *Estado Completo de Sockets*\n\n';

                message += `> ${systemIcon} *Sistema* » *${systemOpen ? 'Abierto' : 'Cerrado'}*\n`;
                if (sessionLimit) {
                    const available = Math.max(0, sessionLimit - activeSubbots);
                    message += `> *Límite* » *${sessionLimit}* (${available} disponibles)\n`;
                }
                message += '\n';

                message += `> *Activos* » *${activeSubbots + activePrembots}*\n`;
                message += `  ● *Sub-Bots* » *${activeSubbots}*\n`;
                message += `  ● *Prem-Bots* » *${activePrembots}*\n\n`;

                message += `> *Registrados* » *${regSubbots + regPrembots}*\n`;
                message += `  ● *Sub-Bots* » *${regSubbots}*\n`;
                message += `  ● *Prem-Bots* » *${regPrembots}*\n\n`;

                if (activeSubbots > 0) {
                    message += `> *Sub-Bots Conectados:*\n`;
                    subbotsList.forEach((sb: any, i: number) => {
                        const num = sb.userId.split('@')[0];
                        message += `  ${i + 1}. *${num}* » Sub-Bot\n`;
                    });
                    message += '\n';
                }

                if (activePrembots > 0) {
                    message += `> *Prem-Bots Conectados:*\n`;
                    (prembotsList as [string, any][]).forEach(([userId, data], i: number) => {
                        const num = userId.split('@')[0];
                        message += `  ${i + 1}. *${num}* » Prem-Bot\n`;
                    });
                    message += '\n';
                }

                if (activeSubbots === 0 && activePrembots === 0) {
                    message += `> _No hay bots conectados actualmente._\n`;
                }

                if ((global as any).nodeManager) {
                    const nodes = (global as any).nodeManager.getStatus();
                    message += `\n> *Cluster (${nodes.length} nodos):*\n`;
                    nodes.forEach((n: any) => {
                        const icon = n.online ? '🟢' : '🔴';
                        const mem = n.memory ? ` | ${n.memory.used}MB RAM` : '';
                        message += `  ${icon} *${n.id}* » ${n.sessions}/${n.maxSessions}${mem}\n`;
                    });
                }

                return await reply(styleText(message));
            } catch (error) {
                console.error('Error in sockets complete:', error);
                return await reply(styleText('ꕢ Error al obtener estadísticas completas.'));
            }
        }

        if (!isGroup) {
            return await reply(styleText('ꕢ Este comando solo funciona en grupos.'));
        }

        try {
            const groupMetadata = await bot?.sock.groupMetadata(chatId);
            const participants = groupMetadata?.participants.map((p: any) => p.id) || [];

            // Get all active bot IDs
            const subbots = (jadibotManager as any).getSubbots();
            const prembots = Array.from(prembotManager?.prembots.values() || []);

            const groupBots: any[] = [];

            // Check for Sub-Bots in group
            subbots.forEach((sb: any) => {
                const sbId = sb.userId; // e.g. 123456@s.whatsapp.net
                if (participants.includes(sbId)) {
                    groupBots.push({
                        id: sbId,
                        type: 'Sub-Bot',
                        name: sb.name || sbId.split('@')[0]
                    });
                }
            });

            // Check for Prem-Bots in group
            prembots.forEach((pb: any) => {
                const pbId = pb.userId;
                if (participants.includes(pbId)) {
                    if (!groupBots.find(b => b.id === pbId)) {
                        groupBots.push({
                            id: pbId,
                            type: 'Prem-Bot',
                            name: pbId.split('@')[0]
                        });
                    }
                }
            });

            let message = 'ꕣ *Bots en el grupo*\n\n';

            if (groupBots.length === 0) {
                message += '> _No hay bots registrados (Prem/Sub) en este grupo._';
            } else {
                groupBots.forEach(bot => {
                    const number = bot.id.split('@')[0];
                    message += `> ● *${number}* » *[ ${bot.type} ]*\n`;
                });
            }

            await reply(styleText(message));

        } catch (error) {
            console.error('Error in bots command:', error);
            await reply(styleText('ꕢ Ocurrió un error al buscar bots.'));
        }
    }
};

export default command;
