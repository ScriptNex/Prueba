import express from 'express';
import { jadibotManager } from '../external/jadibot.js';
import { CLUSTER_CONFIG } from '../../config/nodes.js';
import { globalLogger as logger } from '../../utils/Logger.js';

export class WorkerServer {
    app: any;
    server: any;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.setupAuth();
        this.setupRoutes();
    }

    setupAuth() {
        this.app.use((req: any, res: any, next: any) => {
            if (req.path === '/health') return next();
            const secret = req.headers['x-cluster-secret'];
            if (secret !== CLUSTER_CONFIG.secret) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            next();
        });
    }

    setupRoutes() {
        this.app.get('/health', (req: any, res: any) => {
            res.json({ status: 'ok', nodeId: CLUSTER_CONFIG.nodeId });
        });
        this.app.get('/worker/health', (req: any, res: any) => {
            const mem = process.memoryUsage();
            res.json({
                nodeId: CLUSTER_CONFIG.nodeId,
                role: CLUSTER_CONFIG.role,
                sessions: jadibotManager.subbots.size,
                pending: jadibotManager.pendingConnections.size,
                memory: {
                    used: Math.round(mem.heapUsed / 1024 / 1024),
                    total: Math.round(mem.heapTotal / 1024 / 1024),
                    rss: Math.round(mem.rss / 1024 / 1024)
                },
                uptime: Math.round(process.uptime())
            });
        });
        this.app.get('/worker/sessions', (req: any, res: any) => {
            const sessions = jadibotManager.getSubbots();
            res.json({ sessions, count: sessions.length });
        });
        this.app.post('/worker/session/start', async (req: any, res: any) => {
            const { phone } = req.body;
            if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });
            try {
                const result = await jadibotManager.startSubbotRemote(phone);
                res.json(result);
            } catch (err: any) {
                logger.error('[WorkerServer] Session start error:', err);
                res.status(500).json({ success: false, message: err.message });
            }
        });
        this.app.post('/worker/session/stop', async (req: any, res: any) => {
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
            const result = jadibotManager.stopSubbot(userId);
            res.json(result);
        });
        this.app.post('/relay/process', async (req: any, res: any) => {
            const { text, chatId, sender, pushName, isGroup } = req.body;
            if (!text) return res.json({ replies: [] });
            const prefixes = ['#', '/', '!'];
            const prefix = prefixes.find(p => text.startsWith(p));
            if (!prefix) return res.json({ replies: [] });
            const args = text.slice(prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            if (!commandName) return res.json({ replies: [] });
            const commandData = (global as any).commandMap?.get(commandName);
            if (!commandData) return res.json({ replies: [{ text: `(ó﹏ò｡) El comando *${commandName}* no existe.` }] });
            const replies: any[] = [];
            const replyFn = async (text: string, options = {}) => { replies.push({ text, ...options }); };
            try {
                const dbService = (global as any).dbService;
                const userData = dbService ? await dbService.getUser(sender) : {};
                const ctx = {
                    bot: { sendMessage: async (jid: string, content: any) => { replies.push(content); }, sock: (global as any).mainBot?.ws || null },
                    msg: { key: { remoteJid: chatId, participant: sender, id: 'relay-' + Date.now() }, pushName, message: {} },
                    sender, chatId, isGroup,
                    body: text, text, args, command: commandName, prefix,
                    isPrembot: false, isSubbot: true, isSpecialBot: true,
                    isFromMe: false, isOwner: false,
                    userData, dbService,
                    gachaService: (global as any).gachaService,
                    cacheManager: (global as any).cacheManager,
                    shopService: (global as any).shopService,
                    levelService: (global as any).levelService,
                    economySeason: (global as any).economySeasonService,
                    tokenService: (global as any).tokenService,
                    prembotManager: (global as any).prembotManager,
                    from: { id: sender, jid: sender, name: pushName || 'Usuario' },
                    reply: replyFn,
                    replyWithAudio: async (url: string, opts = {}) => { replies.push({ audio: { url }, mimetype: 'audio/mpeg', ...opts }); },
                    replyWithVideo: async (url: string, opts = {}) => { replies.push({ video: { url }, ...opts }); },
                    replyWithImage: async (url: string, opts = {}) => { replies.push({ image: { url }, ...opts }); },
                    download: async () => Buffer.from([])
                };
                await commandData.execute(ctx);
                res.json({ replies });
            } catch (err) {
                logger.error('[Relay] Command error:', err);
                res.json({ replies: [{ text: 'ꕢ Error procesando el comando.' }] });
            }
        });
    }

    start(port: number) {
        return new Promise<void>((resolve) => {
            this.server = this.app.listen(port, '0.0.0.0', () => {
                logger.info(`ꕣ WorkerServer corriendo en puerto ${port} (${CLUSTER_CONFIG.nodeId})`);
                resolve();
            });
        });
    }
}
