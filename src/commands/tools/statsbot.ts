import { styleText, formatNumber } from '../../utils/helpers.js';
import os from 'os';
import { performance } from 'perf_hooks';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['statsbot', 'status', 'infobot'],
    tags: ['tools'],
    help: ['statsbot'],

    async execute(ctx: CommandContext) {
        const { bot, dbService, reply } = ctx;

        const start = performance.now();
        const end = performance.now();
        const latency = (end - start).toFixed(2);

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const nodeMem = process.memoryUsage().rss;

        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        try {
            const groups = await bot?.sock.groupFetchAllParticipating().catch(() => ({})) || {};
            const dbStats = await dbService?.getStats() || { users: 0 };

            const totalGroups = Object.keys(groups).length;
            const totalUsers = dbStats.users || 0;

            const formatBytes = (bytes: number) => {
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) return '0 Byte';
                const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
                return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
            };

            const text = `
📊 *ESTADO DEL SISTEMA* 📊

⚡ *Rendimiento*
> 🟢 RAM (Node): ${formatBytes(nodeMem)}
> 🖥️ RAM (Total): ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
> ⏱️ Uptime: ${uptimeStr}
> 🚀 Ping: ${latency}ms

📈 *Estadísticas*
> 👥 Usuarios: ${formatNumber(totalUsers)}
> 🛡️ Grupos: ${formatNumber(totalGroups)}
> 🤖 Plataforma: ${os.platform()} (${os.arch()})
> 📦 Node.js: ${process.version}

💾 *Base de Datos*
> 📁 Caché Usuarios: ${(dbService as any)?.getCacheStats?.().users?.size || 'N/A'}
> 📁 Caché Grupos: ${(dbService as any)?.getCacheStats?.().groups?.size || 'N/A'}
`.trim();

            await reply(styleText(text));
        } catch (error) {
            console.error('Error in statsbot:', error);
            await reply(styleText('⚠️ Error al obtener estadísticas del bot.'));
        }
    }
};

export default command;
