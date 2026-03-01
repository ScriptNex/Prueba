import { Bot, LocalAuth } from '@imjxsx/wapi';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { globalLogger as logger } from '../../utils/Logger.js';
import TokenService from './TokenService.js';

const BLOCKED_COMMANDS = [
    'eval', 'exec', 'shell', 'terminal', 'bash', 'cmd',
    'setowner', 'addowner', 'delowner', 'removeowner',
    'restart', 'shutdown', 'update', 'reboot',
    'banuser', 'unbanuser', 'globalban',
    'broadcast', 'bcall', 'bcgc',
    'setprefix', 'setbotname',
    'addprem', 'delprem',
    'clearsession', 'deletesession'
];

const LIMITS = {
    MAX_GROUPS: 50,
    MAX_CHATS: 200,
    COMMANDS_PER_MINUTE: 30,
    MESSAGES_PER_MINUTE: 60,
    SPAM_TIMEOUT: 5 * 60 * 1000,
    RECONNECT_ATTEMPTS: 5,
    BACKUP_INTERVAL: 5 * 60 * 1000
};

export class PrembotManager {
    tokenService: TokenService;
    prembots: Map<string, any>;
    pendingConnections: Map<string, any>;
    codes: Map<string, any>;
    spamTracker: Map<string, any>;
    groupCounts: Map<string, number>;

    constructor(tokenService: TokenService) {
        this.tokenService = tokenService;
        this.prembots = new Map();
        this.pendingConnections = new Map();
        this.codes = new Map();
        this.spamTracker = new Map();
        this.groupCounts = new Map();
    }

    generateCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    isCommandBlocked(command: string) {
        return BLOCKED_COMMANDS.includes(command.toLowerCase());
    }

    createPairingCode(userId: string, tokenId: string) {
        const code = this.generateCode();
        this.codes.set(code, {
            userId,
            tokenId,
            createdAt: Date.now()
        });
        setTimeout(() => this.codes.delete(code), 5 * 60 * 1000);
        return code;
    }

    async startPrembot(tokenId: string, chatId: string, mainSock: any, phoneNumber: string) {
        const validation = this.tokenService.validateToken(tokenId);
        if (!validation.valid) {
            return { success: false, message: `ꕢ ${validation.error}` };
        }
        let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            return { success: false, message: `ꕢ Número de teléfono inválido: ${cleanPhone} (${cleanPhone.length} dígitos)` };
        }
        const userId = `${cleanPhone}@s.whatsapp.net`;
        if (this.prembots.has(userId)) {
            return { success: false, message: 'ꕢ Ya tienes un Prembot activo' };
        }
        if (this.pendingConnections.has(userId)) {
            return { success: false, message: 'ꕢ Ya hay una conexión en proceso' };
        }
        this.pendingConnections.set(userId, {
            startTime: Date.now(),
            tokenId: tokenId
        });
        try {
            const sessionPath = path.join(process.cwd(), 'prembots', cleanPhone);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            fs.mkdirSync(sessionPath, { recursive: true });
            const prembotUUID = uuidv4();
            const auth = new LocalAuth(prembotUUID as any, sessionPath);
            const account = { jid: '', pn: `${cleanPhone}@s.whatsapp.net`, name: 'Alya Kujou Prembot' };
            const botLogger = pino({ level: 'info' });
            const prembotInstance: any = new (Bot as any)(prembotUUID as any, auth, account, {
                browser: ['Windows', 'Chrome', '20.0.04'],
                logger: botLogger,
                mobile: false
            });
            prembotInstance.logger = botLogger;
            
            let isConnected = false;
            const timeout = setTimeout(() => {
                if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    prembotInstance.disconnect?.();
                    mainSock.sendMessage(chatId, {
                        text: 'ꕢ *Tiempo agotado*\n\n> No se pudo vincular. El token sigue disponible.'
                    }).catch(() => { });
                }
            }, 3 * 60 * 1000);

            prembotInstance.on('open', async (acc: any) => {
                clearTimeout(timeout);
                isConnected = true;
                this.pendingConnections.delete(userId);
                this.tokenService.useToken(tokenId, userId);
                this.tokenService.registerPrembot(userId, tokenId);
                const prembotData = {
                    bot: prembotInstance,
                    chatId,
                    sessionPath,
                    uuid: prembotUUID,
                    tokenId,
                    userId,
                    connectedAt: Date.now(),
                    stats: { messages: 0, commands: 0 },
                    rateLimit: { commands: [], messages: [] }
                };
                this.prembots.set(userId, prembotData);
                this.startBackupInterval(userId);
                const userName = acc?.name || 'Usuario';
                await mainSock.sendMessage(chatId, {
                    text: `ꕢ *PREMBOT ACTIVADO*\n\n` +
                        `> ${userName}\n` +
                        `> ${cleanPhone}\n` +
                        `> Token: ${tokenId.slice(0, 15)}...\n\n` +
                        `> _*Límites:*_\n` +
                        `• Grupos: ${LIMITS.MAX_GROUPS}\n` +
                        `• Chats: ${LIMITS.MAX_CHATS}\n` +
                        `• Cmds/min: ${LIMITS.COMMANDS_PER_MINUTE}\n\n` +
                        `> _Usa #prembot status para ver stats_`
                });
                this.setupMessageHandler(prembotInstance, userId);
            });

            prembotInstance.on('close', async (reason: any) => {
                logger.info('[Prembot] Disconnected: ' + reason);
                clearTimeout(timeout);
                if (isConnected) {
                    const reasonStr = String(reason).toLowerCase();
                    const isFatal = reasonStr.includes('401') || reasonStr.includes('403') || reasonStr.includes('428');
                    this.prembots.delete(userId);
                    if (!isFatal) {
                        setTimeout(() => this.restartSession(userId, mainSock, tokenId), 5000);
                    }
                } else {
                    this.pendingConnections.delete(userId);
                    let errorMsg = 'ꕢ No se pudo conectar';
                    const reasonStr = String(reason).toLowerCase();
                    if (reasonStr.includes('401')) errorMsg = 'ꕢ Código inválido';
                    else if (reasonStr.includes('403')) errorMsg = 'ꕢ WhatsApp bloqueó temporalmente';
                    else if (reasonStr.includes('428')) errorMsg = 'ꕢ Máximo de dispositivos alcanzado';
                    mainSock.sendMessage(chatId, { text: errorMsg }).catch(() => { });
                }
            });

            await prembotInstance.login('otp');
            await new Promise(resolve => setTimeout(resolve, 8000));
            const socket = prembotInstance.ws || prembotInstance.sock;
            if (socket?.requestPairingCode) {
                const code = await socket.requestPairingCode(cleanPhone);
                const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                await mainSock.sendMessage(chatId, {
                    text: `🌟 *PREMBOT - Código de Vinculación*\n\n` +
                        `\`${formatted}\`\n\n` +
                        `*Pasos:*\n` +
                        `① Abre WhatsApp\n` +
                        `② Dispositivos vinculados\n` +
                        `③ Vincular dispositivo\n` +
                        `④ Vincular con número\n` +
                        `⑤ Ingresa el código\n\n` +
                        `> _Expira en 3 minutos_`
                });
                await mainSock.sendMessage(chatId, { text: code });
                return { success: true, message: 'ꕢ Código enviado. Revisa tu chat.' };
            }
            throw new Error('Socket not ready');
        } catch (error: any) {
            this.pendingConnections.delete(userId);
            return { success: false, message: 'ꕢ Error: ' + error.message };
        }
    }

    setupMessageHandler(prembotInstance: any, ownerId: string) {
        prembotInstance.ws?.ev.on('messages.upsert', async ({ messages }: any) => {
            for (const m of messages) {
                if (!m.message) continue;
                const chatId = m.key.remoteJid;
                const prembotData = this.prembots.get(ownerId);
                if (!prembotData) continue;
                const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
                if (m.key.fromMe) {
                    const isCommand = text.startsWith('#') || text.startsWith('/') || text.startsWith('!');
                    if (!isCommand) continue;
                }
                if (!this.tokenService.isPrembotActive(ownerId)) {
                    await prembotInstance.sendMessage(chatId, { text: 'ꕢ Este Prembot ha expirado.' });
                    this.stopPrembot(ownerId);
                    return;
                }
                const rateCheck = this.checkRateLimit(ownerId, 'messages');
                if (!rateCheck.allowed) continue;
                prembotData.stats.messages++;
                this.tokenService.updateStats(ownerId, 'messages');
                if (text.startsWith('#') || text.startsWith('/') || text.startsWith('!')) {
                    const command = text.slice(1).split(' ')[0].toLowerCase();
                    if (this.isCommandBlocked(command)) continue;
                    const cmdRateCheck = this.checkRateLimit(ownerId, 'commands');
                    if (!cmdRateCheck.allowed) continue;
                    prembotData.stats.commands++;
                    this.tokenService.updateStats(ownerId, 'commands');
                }
                if ((global as any).messageHandler) {
                    await (global as any).messageHandler.handleMessage(prembotInstance, m, true, false);
                }
            }
        });
    }

    checkRateLimit(userId: string, type: 'messages' | 'commands') {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) return { allowed: false };
        const now = Date.now();
        const oneMinAgo = now - 60000;
        const limit = type === 'commands' ? LIMITS.COMMANDS_PER_MINUTE : LIMITS.MESSAGES_PER_MINUTE;
        prembotData.rateLimit[type] = prembotData.rateLimit[type].filter((t: number) => t > oneMinAgo);
        if (prembotData.rateLimit[type].length >= limit) return { allowed: false, waitTime: 60000 };
        prembotData.rateLimit[type].push(now);
        return { allowed: true };
    }

    startBackupInterval(userId: string) {
        const prembotData = this.prembots.get(userId);
        if (prembotData) {
            prembotData.backupInterval = setInterval(() => this.backupSession(userId), LIMITS.BACKUP_INTERVAL);
        }
    }

    backupSession(userId: string) {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) return;
        try {
            const backupDir = path.join(process.cwd(), 'prembots_backup', userId.split('@')[0]);
            fs.mkdirSync(backupDir, { recursive: true });
            if (fs.existsSync(prembotData.sessionPath)) {
                const files = fs.readdirSync(prembotData.sessionPath);
                for (const file of files) {
                    fs.copyFileSync(path.join(prembotData.sessionPath, file), path.join(backupDir, file));
                }
            }
        } catch (e) {}
    }

    stopPrembot(userId: string) {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) return { success: false };
        clearInterval(prembotData.backupInterval);
        prembotData.bot?.disconnect?.();
        this.prembots.delete(userId);
        return { success: true };
    }

    getPrembotStatus(userId: string) {
        const prembotData = this.prembots.get(userId);
        const tokenData = this.tokenService.getPrembot(userId);
        if (!prembotData && !tokenData) return null;
        return {
            active: !!prembotData,
            userId,
            daysRemaining: Math.max(0, Math.ceil(((tokenData?.expiresAt || 0) - Date.now()) / (24 * 60 * 60 * 1000))),
            stats: prembotData?.stats || tokenData?.stats || { messages: 0, commands: 0 }
        };
    }

    async loadSessions(mainSock: any) {
        const sessionsDir = path.join(process.cwd(), 'prembots');
        if (!fs.existsSync(sessionsDir)) return;
        const files = fs.readdirSync(sessionsDir);
        for (const file of files) {
            const userId = `${file}@s.whatsapp.net`;
            const tokenData = this.tokenService.getPrembot(userId);
            if (tokenData && !tokenData.banned) this.restartSession(userId, mainSock, tokenData.tokenId);
        }
    }

    async restartSession(userId: string, mainSock: any, tokenId: string) {
        if (this.prembots.has(userId)) return;
        const cleanPhone = userId.split('@')[0];
        const sessionPath = path.join(process.cwd(), 'prembots', cleanPhone);
        try {
            const prembotUUID = uuidv4();
            const auth = new LocalAuth(prembotUUID as any, sessionPath);
            const prembotInstance: any = new (Bot as any)(prembotUUID as any, auth, { jid: '', pn: userId, name: '' });
            prembotInstance.on('open', async () => {
                const prembotData = {
                    bot: prembotInstance,
                    userId,
                    sessionPath,
                    connectedAt: Date.now(),
                    stats: { messages: 0, commands: 0 },
                    rateLimit: { commands: [], messages: [] }
                };
                this.prembots.set(userId, prembotData);
                this.startBackupInterval(userId);
                this.setupMessageHandler(prembotInstance, userId);
            });
            await prembotInstance.login('qr');
        } catch (e) {}
    }

    getAllPrembots() {
        return Array.from(this.prembots.entries()).map(([userId, data]) => ({
            userId,
            connectedAt: data.connectedAt,
            stats: data.stats
        }));
    }
}
export default PrembotManager;
