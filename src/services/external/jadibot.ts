import { Bot, LocalAuth } from '@imjxsx/wapi';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { globalLogger as logger } from '../../utils/Logger.js';
import { CLUSTER_CONFIG } from '../../config/nodes.js';

export class JadibotManager {
    subbots: Map<string, any>;
    codes: Map<string, any>;
    pendingConnections: Map<string, any>;

    constructor() {
        this.subbots = new Map();
        this.codes = new Map();
        this.pendingConnections = new Map();
    }

    generateCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    createCode(userId: string) {
        const code = this.generateCode();
        this.codes.set(code, { userId, createdAt: Date.now() });
        setTimeout(() => this.codes.delete(code), 5 * 60 * 1000);
        return code;
    }

    async startSubbot(code: string | null = null, chatId: string, mainSock: any, phoneNumber: string | null = null) {
        if ((global as any).db?.settings?.subbotsOpen === false) {
            return { success: false, message: 'ꕢ El sistema de subbots está cerrado.\n\n> _Contacta al owner para más información_' };
        }
        const sessionLimit = (global as any).db?.settings?.subbotSessionLimit;
        if (sessionLimit) {
            const totalSessions = (global as any).nodeManager
                ? (global as any).nodeManager.getTotalSessions()
                : this.subbots.size;
            if (totalSessions >= sessionLimit) {
                return { success: false, message: `ꕢ No hay espacios disponibles.\n\n> *Límite* » *${sessionLimit}*\n> *Activos* » *${totalSessions}*\n\n> _Contacta al owner para más información_` };
            }
        }
        if (phoneNumber && (global as any).nodeManager) {
            const bestNode = (global as any).nodeManager.getBestNode();
            if (bestNode && !bestNode.local) {
                logger.info(`[Jadibot] Routing to remote node: ${bestNode.id}`);
                const result = await (global as any).nodeManager.startRemoteSession(bestNode, phoneNumber);
                if (result.success && result.otp) {
                    const formatted = result.otp.match(/.{1,4}/g)?.join('-') || result.otp;
                    await mainSock.sendMessage(chatId, {
                        text: `𓆩❤︎𓆪 *Código de vinculación:*\n\n\`${formatted}\`\n\n*Servidor:* ${bestNode.id}\n\n*Pasos:*\n① » Abre WhatsApp en tu teléfono\n② » Dispositivos vinculados\n③ » Toca *"Vincular dispositivo"*\n④ » Elige *"Vincular con número de teléfono"*\n⑤ » Ingresa el código\n\n> _El código expira en 3 minutos_`
                    });
                    await mainSock.sendMessage(chatId, { text: result.otp });
                    return { success: true, message: 'ꕢ Código enviado (nodo remoto)' };
                }
                if (!result.success) {
                    logger.warn(`[Jadibot] Remote node ${bestNode.id} failed, trying local`);
                }
            }
        }
        if (phoneNumber) { return await this.startWithPairingCode(chatId, mainSock, phoneNumber) }
        if (code) {
            return await this.startWithQR(code, chatId, mainSock);
        }
        return { success: false, message: 'ꕢ Se requiere código o número de teléfono' };
    }

    async startWithPairingCode(chatId: string, mainSock: any, phoneNumber: string) {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        const userId = `${cleanPhone}@s.whatsapp.net`;
        if (this.subbots.has(userId)) {
            return { success: false, message: 'ꕢ Ya tienes un sub-bot activo' };
        }
        if (this.pendingConnections.has(userId)) {
            return { success: false, message: 'ꕢ Ya hay una conexión en proceso' };
        }
        this.pendingConnections.set(userId, { startTime: Date.now() });
        try {
            const sessionPath = path.join(process.cwd(), 'subbots', cleanPhone);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            fs.mkdirSync(sessionPath, { recursive: true });
            const subbotUUID = uuidv4();
            const auth = new LocalAuth(subbotUUID as any, sessionPath);
            const account = { jid: '', pn: `${cleanPhone}@s.whatsapp.net`, name: '' };
            const subbotInstance: any = new (Bot as any)(subbotUUID as any, auth, account);
            let isConnected = false;
            const timeout = setTimeout(() => {
                if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    subbotInstance.disconnect?.();
                    mainSock.sendMessage(chatId, {
                        text: 'ꕢ *Tiempo agotado*\n\n> No se pudo vincular. Intenta nuevamente con */code*'
                    }).catch(() => { });
                }
            }, 3 * 60 * 1000);
            subbotInstance.on('otp', async (otpCode: string) => {
                logger.info('[Jadibot] OTP code received: ' + otpCode);
                const formatted = otpCode.match(/.{1,4}/g)?.join('-') || otpCode;
                await mainSock.sendMessage(chatId, {
                    text: `𓆩❤︎𓆪 *Código de vinculación:*\n\n\`${formatted}\`\n\n*Pasos:*\n① » Abre WhatsApp en tu teléfono\n② » Dispositivos vinculados*\n③ » Toca *"Vincular dispositivo"*\n④ » Elige *"Vincular con número de teléfono"*\n⑤ » Ingresa el código\n\n> _El código expira en 3 minutos 订_`
                });
                await mainSock.sendMessage(chatId, { text: otpCode });
            });
            subbotInstance.on('open', async (acc: any) => {
                clearTimeout(timeout);
                isConnected = true;
                this.pendingConnections.delete(userId);
                this.subbots.set(userId, {
                    bot: subbotInstance,
                    chatId,
                    sessionPath,
                    uuid: subbotUUID
                });
                const userName = acc?.name || 'Usuario';
                await mainSock.sendMessage(chatId, {
                    text: `ꕢ *Sub-bot vinculado exitosamente*\n\n⸝⸝ ${userName}\n⸝⸝ ${cleanPhone}\n\n> *_Ya puedes usar el bot desde ese número_*`
                });
                subbotInstance.ws?.ev.on('messages.upsert', async ({ messages }: any) => {
                    const m = messages[0];
                    if (!m.message || m.key.fromMe) return;
                    if ((global as any).messageHandler) {
                        await (global as any).messageHandler.handleMessage(subbotInstance, m);
                    }
                });
            });
            subbotInstance.on('close', (reason: any) => {
                logger.info('[Jadibot] Connection closed: ' + reason);
                clearTimeout(timeout);
                if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    let errorMsg = 'ꕢ No se pudo conectar';
                    const reasonStr = String(reason).toLowerCase();
                    if (reasonStr.includes('401')) {
                        errorMsg = 'ꕢ Código inválido o expirado';
                    } else if (reasonStr.includes('403')) {
                        errorMsg = 'ꕢ WhatsApp bloqueó la conexión. Espera unos minutos.';
                    } else if (reasonStr.includes('428')) {
                        errorMsg = 'ꕢ Demasiados dispositivos vinculados (máx 4)';
                    } else if (reasonStr.includes('515')) {
                        errorMsg = 'ꕢ Requiere reinicio. Intenta de nuevo.';
                    }
                    mainSock.sendMessage(chatId, { text: errorMsg }).catch(() => { });
                } else {
                    const reasonStr = String(reason).toLowerCase();
                    const isFatal = reasonStr.includes('401') || reasonStr.includes('403') || reasonStr.includes('428');
                    this.subbots.delete(userId);
                    if (!isFatal) {
                        logger.info(`[Jadibot] Connection lost for ${cleanPhone}. Reconnecting in 5s...`);
                        setTimeout(() => this.restartSession(userId, mainSock), 5000);
                    }
                }
            });
            subbotInstance.on('error', (err: any) => {
                logger.error('[Jadibot] Error:', err);
            });
            logger.info('[Jadibot] Starting login with OTP for: ' + cleanPhone);
            await subbotInstance.login('otp');
            return { success: true, message: 'ꕢ Generando código...' };
        } catch (error: any) {
            logger.error('[Jadibot] Error:', error.message);
            this.pendingConnections.delete(userId);
            return { success: false, message: 'ꕢ Error: ' + error.message };
        }
    }

    async startWithQR(code: string, chatId: string, mainSock: any) {
        const codeData = this.codes.get(code);
        if (!codeData) {
            return { success: false, message: 'ꕢ Código inválido o expirado' };
        }
        const userId = codeData.userId;
        const cleanUserId = userId.split('@')[0];
        if (this.subbots.has(userId)) {
            return { success: false, message: 'ꕢ Ya tienes un sub-bot activo' };
        }
        if (this.pendingConnections.has(userId)) {
            return { success: false, message: 'ꕢ Ya hay una conexión en proceso' };
        }
        this.pendingConnections.set(userId, { startTime: Date.now() });
        try {
            const sessionPath = path.join(process.cwd(), 'subbots', cleanUserId);
            fs.mkdirSync(sessionPath, { recursive: true });
            const subbotUUID = uuidv4();
            const auth = new LocalAuth(subbotUUID as any, sessionPath);
            const account = { jid: '', pn: '', name: '' };
            const subbotInstance: any = new (Bot as any)(subbotUUID as any, auth, account);
            let isConnected = false;
            const timeout = setTimeout(() => {
                if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    subbotInstance.disconnect?.();
                    mainSock.sendMessage(chatId, { text: 'ꕢ Tiempo agotado' }).catch(() => { });
                }
            }, 2 * 60 * 1000);
            subbotInstance.on('qr', async (qr: string) => {
                const qrBuffer = await QRCode.toBuffer(qr, { scale: 8 });
                await mainSock.sendMessage(chatId, {
                    image: qrBuffer,
                    caption: "> ꩜ *Escanea este QR con WhatsApp*\n\n> _Tienes 2 minutos_"
                });
            });
            subbotInstance.on('open', async (acc: any) => {
                clearTimeout(timeout);
                isConnected = true;
                this.pendingConnections.delete(userId);
                this.codes.delete(code);
                this.subbots.set(userId, {
                    bot: subbotInstance,
                    chatId,
                    sessionPath,
                    uuid: subbotUUID
                });
                await mainSock.sendMessage(chatId, {
                    text: `ꕣ Sub-bot conectado\n\n➜ ${cleanUserId}`
                });
                subbotInstance.ws?.ev.on('messages.upsert', async ({ messages }: any) => {
                    const m = messages[0];
                    if (!m.message || m.key.fromMe) return;
                    if ((global as any).messageHandler) {
                        await (global as any).messageHandler.handleMessage(subbotInstance, m);
                    }
                });
            });
            subbotInstance.on('close', (reason: any) => {
                clearTimeout(timeout);
                if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    mainSock.sendMessage(chatId, { text: 'ꕢ No se pudo conectar' }).catch(() => { });
                } else {
                    const reasonStr = String(reason).toLowerCase();
                    const isFatal = reasonStr.includes('401') || reasonStr.includes('403') || reasonStr.includes('428');
                    this.subbots.delete(userId);
                    if (!isFatal) {
                        logger.info(`[Jadibot] Connection lost for ${cleanUserId}. Reconnecting in 5s...`);
                        setTimeout(() => this.restartSession(userId, mainSock), 5000);
                    }
                }
            });
            await subbotInstance.login('qr');
            return { success: true, message: 'ꕢ Generando QR...' };
        } catch (error: any) {
            logger.error('[Jadibot] QR Error:', error.message);
            this.pendingConnections.delete(userId);
            return { success: false, message: 'ꕢ Error: ' + error.message };
        }
    }

    stopSubbot(userId: string) {
        const subbotData = this.subbots.get(userId);
        if (!subbotData) {
            if (this.pendingConnections.has(userId)) {
                this.pendingConnections.delete(userId);
                return { success: true, message: 'ꕣ Vinculación cancelada' };
            }
            return { success: false, message: 'ꕢ No tienes un sub-bot activo' };
        }
        try {
            if (subbotData.bot) {
                subbotData.bot.disconnect?.();
            }
            this.subbots.delete(userId);
            return { success: true, message: 'ꕣ Sub-bot detenido' };
        } catch (error) {
            return { success: false, message: 'ꕢ Error al detener' };
        }
    }

    async logoutSubbot(userId: string) {
        const cleanPhone = userId.split('@')[0];
        const sessionPath = path.join(process.cwd(), 'subbots', cleanPhone);
        
        // Stop if running
        this.stopSubbot(userId);

        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                return { success: true, message: 'ꕣ Sesión eliminada correctamente' };
            }
            return { success: false, message: 'ꕢ No se encontró ninguna sesión guardada' };
        } catch (error: any) {
            logger.error(`[Jadibot] Error deleting session for ${cleanPhone}:`, error.message);
            return { success: false, message: 'ꕢ Error al eliminar la sesión' };
        }
    }

    async logoutAllSubbots() {
        const sessionsDir = path.join(process.cwd(), 'subbots');
        
        // Disconnect all active ones
        for (const [userId, data] of this.subbots.entries()) {
            if (data.bot) {
                data.bot.disconnect?.();
            }
        }
        this.subbots.clear();
        this.pendingConnections.clear();

        try {
            if (fs.existsSync(sessionsDir)) {
                const files = fs.readdirSync(sessionsDir);
                for (const file of files) {
                    const fullPath = path.join(sessionsDir, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                    }
                }
                return { success: true, message: 'ꕣ Todas las sesiones han sido eliminadas' };
            }
            return { success: true, message: 'ꕢ No hay sesiones para eliminar' };
        } catch (error: any) {
            logger.error(`[Jadibot] Error deleting all sessions:`, error.message);
            return { success: false, message: 'ꕢ Error al eliminar todas las sesiones' };
        }
    }

    async loadSessions(mainSock: any) {
        const sessionsDir = path.join(process.cwd(), 'subbots');
        if (!fs.existsSync(sessionsDir)) return;
        const files = fs.readdirSync(sessionsDir);
        for (const file of files) {
            const userId = `${file}@s.whatsapp.net`;
            if (fs.statSync(path.join(sessionsDir, file)).isDirectory()) {
                logger.info(`[Jadibot] Restoring session for ${file}`);
                this.restartSession(userId, mainSock);
            }
        }
    }

    async restartSession(userId: string, mainSock: any) {
        if (this.subbots.has(userId)) return;
        const cleanPhone = userId.split('@')[0];
        const sessionPath = path.join(process.cwd(), 'subbots', cleanPhone);
        try {
            const subbotUUID = uuidv4();
            const auth = new LocalAuth(subbotUUID as any, sessionPath);
            const account = { jid: '', pn: userId, name: '' };
            const subbotInstance: any = new (Bot as any)(subbotUUID as any, auth, account);
            subbotInstance.on('open', async (acc: any) => {
                this.subbots.set(userId, {
                    bot: subbotInstance,
                    chatId: null,
                    sessionPath,
                    uuid: subbotUUID
                });
                logger.info(`[Jadibot] Session restored for ${cleanPhone}`);
                subbotInstance.ws?.ev.on('messages.upsert', async ({ messages }: any) => {
                    const m = messages[0];
                    if (!m.message || m.key.fromMe) return;
                    if ((global as any).messageHandler) {
                        await (global as any).messageHandler.handleMessage(subbotInstance, m);
                    }
                });
            });
            subbotInstance.on('close', (reason: any) => {
                logger.info(`[Jadibot] Session closed for ${cleanPhone}: ${reason}`);
                const reasonStr = String(reason).toLowerCase();
                const isFatal = reasonStr.includes('401') || reasonStr.includes('403') || reasonStr.includes('428');
                this.subbots.delete(userId);
                if (!isFatal) {
                    logger.info(`[Jadibot] Auto-reconnecting ${cleanPhone} in 5s...`);
                    setTimeout(() => this.restartSession(userId, mainSock), 5000);
                }
            });
            subbotInstance.on('error', (err: any) => {
                logger.error('[Jadibot] Error:', err);
            });
            logger.info(`[Jadibot] Restarting login for: ${cleanPhone}`);
            await subbotInstance.login('qr');
        } catch (error: any) {
            logger.error(`[Jadibot] Failed to restart session for ${userId}:`, error.message);
        }
    }

    getSubbots() {
        return Array.from(this.subbots.entries()).map(([userId, data]) => ({
            userId,
            chatId: data.chatId,
            nodeId: CLUSTER_CONFIG.nodeId
        }));
    }

    async startSubbotRemote(phoneNumber: string): Promise<any> {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        const userId = `${cleanPhone}@s.whatsapp.net`;
        if (this.subbots.has(userId)) {
            return { success: false, message: 'ꕢ Ya tienes un sub-bot activo' };
        }
        if (this.pendingConnections.has(userId)) {
            return { success: false, message: 'ꕢ Ya hay una conexión en proceso' };
        }
        this.pendingConnections.set(userId, { startTime: Date.now() });
        try {
            const sessionPath = path.join(process.cwd(), 'subbots', cleanPhone);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            fs.mkdirSync(sessionPath, { recursive: true });
            const subbotUUID = uuidv4();
            const auth = new LocalAuth(subbotUUID as any, sessionPath);
            const account = { jid: '', pn: `${cleanPhone}@s.whatsapp.net`, name: '' };
            const subbotInstance: any = new (Bot as any)(subbotUUID, auth, account);
            return new Promise((resolve) => {
                let isConnected = false;
                let resolved = false;
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        this.pendingConnections.delete(userId);
                        subbotInstance.disconnect?.();
                        resolve({ success: false, message: 'ꕢ Tiempo agotado' });
                    }
                }, 90000);
                subbotInstance.on('otp', (otpCode: string) => {
                    if (!resolved) {
                        resolved = true;
                        logger.info(`[Jadibot-Worker] OTP received for ${cleanPhone}: ${otpCode}`);
                        resolve({ success: true, otp: otpCode, nodeId: CLUSTER_CONFIG.nodeId });
                    }
                });
                subbotInstance.on('open', async (acc: any) => {
                    clearTimeout(timeout);
                    isConnected = true;
                    this.pendingConnections.delete(userId);
                    this.subbots.set(userId, {
                        bot: subbotInstance,
                        chatId: null,
                        sessionPath,
                        uuid: subbotUUID
                    });
                    logger.info(`[Jadibot-Worker] Subbot connected: ${cleanPhone}`);
                    subbotInstance.ws?.ev.on('messages.upsert', async ({ messages }: any) => {
                        const m = messages[0];
                        if (!m.message || m.key.fromMe) return;
                        if ((global as any).messageHandler) {
                            await (global as any).messageHandler.handleMessage(subbotInstance, m);
                        }
                    });
                });
                subbotInstance.on('close', (reason: any) => {
                    clearTimeout(timeout);
                    if (!isConnected) {
                        this.pendingConnections.delete(userId);
                        if (!resolved) { resolved = true; resolve({ success: false, message: 'ꕢ No se pudo conectar' }); }
                    } else {
                        const reasonStr = String(reason).toLowerCase();
                        const isFatal = reasonStr.includes('401') || reasonStr.includes('403') || reasonStr.includes('428');
                        this.subbots.delete(userId);
                        if (!isFatal) {
                            logger.info(`[Jadibot-Worker] Reconnecting ${cleanPhone} in 5s...`);
                            setTimeout(() => this.restartSession(userId, null), 5000);
                        }
                    }
                });
                subbotInstance.on('error', (err: any) => {
                    logger.error('[Jadibot-Worker] Error:', err);
                });
                logger.info(`[Jadibot-Worker] Starting OTP login for: ${cleanPhone}`);
                subbotInstance.login('otp').catch((err: any) => {
                    if (!resolved) {
                        resolved = true;
                        this.pendingConnections.delete(userId);
                        resolve({ success: false, message: 'ꕢ Error: ' + err.message });
                    }
                });
            });
        } catch (error: any) {
            this.pendingConnections.delete(userId);
            return { success: false, message: 'ꕢ Error: ' + error.message };
        }
    }
}

export const jadibotManager = new JadibotManager();
