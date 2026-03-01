import { CLUSTER_CONFIG } from '../../config/nodes.js';
import { globalLogger as logger } from '../../utils/Logger.js';

export class NodeManager {
    nodes: any[];
    healthInterval: NodeJS.Timeout | null;

    constructor() {
        this.nodes = CLUSTER_CONFIG.nodes.map((n: any) => ({
            ...n,
            local: n.id === CLUSTER_CONFIG.nodeId,
            online: n.id === CLUSTER_CONFIG.nodeId,
            sessions: 0,
            memory: null,
            lastCheck: 0
        }));
        this.healthInterval = null;
    }

    start() {
        this.checkHealth();
        this.healthInterval = setInterval(() => this.checkHealth(), 30000);
        logger.info(`ꕣ NodeManager iniciado con ${this.nodes.length} nodos`);
    }

    stop() {
        if (this.healthInterval) clearInterval(this.healthInterval);
    }

    async checkHealth() {
        for (const node of this.nodes) {
            if (node.local) {
                try {
                    const { jadibotManager } = await import('../external/jadibot.js');
                    node.sessions = jadibotManager.subbots.size;
                    node.online = true;
                    const mem = process.memoryUsage();
                    node.memory = {
                        used: Math.round(mem.heapUsed / 1024 / 1024),
                        total: Math.round(mem.heapTotal / 1024 / 1024)
                    };
                } catch { 
                    node.online = true; 
                    node.sessions = 0; 
                }
                node.lastCheck = Date.now();
                continue;
            }
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(`${node.url}/worker/health`, {
                    headers: { 'x-cluster-secret': CLUSTER_CONFIG.secret },
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (res.ok) {
                    const data: any = await res.json();
                    node.online = true;
                    node.sessions = data.sessions || 0;
                    node.memory = data.memory || null;
                } else {
                    node.online = false;
                }
            } catch {
                node.online = false;
            }
            node.lastCheck = Date.now();
        }
    }

    getBestNode() {
        const available = this.nodes.filter(n => n.online && n.sessions < n.maxSessions);
        if (available.length === 0) return null;
        return available.sort((a, b) => a.sessions - b.sessions)[0];
    }

    getTotalSessions() {
        return this.nodes.reduce((sum, n) => sum + (n.online ? n.sessions : 0), 0);
    }

    async startRemoteSession(node: any, phone: string) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000);
            const res = await fetch(`${node.url}/worker/session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cluster-secret': CLUSTER_CONFIG.secret
                },
                body: JSON.stringify({ phone }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            return await res.json();
        } catch (err: any) {
            logger.error(`[NodeManager] Error connecting to ${node.id}:`, err.message);
            return { success: false, message: `ꕢ Error de conexión con ${node.id}` };
        }
    }

    async stopRemoteSession(node: any, userId: string) {
        try {
            const res = await fetch(`${node.url}/worker/session/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cluster-secret': CLUSTER_CONFIG.secret
                },
                body: JSON.stringify({ userId })
            });
            return await res.json();
        } catch (err: any) {
            return { success: false, message: `ꕢ Error: ${err.message}` };
        }
    }

    getStatus() {
        return this.nodes.map(n => ({
            id: n.id,
            local: n.local,
            online: n.online,
            sessions: n.sessions,
            maxSessions: n.maxSessions,
            memory: n.memory
        }));
    }
}
