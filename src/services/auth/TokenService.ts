import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATA_PATHS } from '../../config/data.js';
import { globalLogger as logger } from '../../utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Token {
    id: string;
    userId: string;
    createdAt: number;
    expiresAt: number;
    duration: string;
    used: boolean;
    usedBy: string | null;
    usedAt: number | null;
}

export interface Prembot {
    userId: string;
    tokenId: string;
    connectedAt: number;
    expiresAt: number;
    stats: { messages: number; commands: number; groups: number };
    limits: { groups: number; chats: number; commandsPerMin: number };
    commandHistory: number[];
    banned: boolean;
    banReason: string | null;
    customName: string | null;
    customImage: string | null;
}

export class TokenService {
    tokensPath: string;
    data: { tokens: Token[]; prembots: Prembot[]; payments: any[] };
    isDirty: boolean;
    saveInterval: NodeJS.Timeout | null;
    paypal: any;

    constructor() {
        this.tokensPath = DATA_PATHS.TOKENS;
        this.data = { tokens: [], prembots: [], payments: [] };
        this.isDirty = false;
        this.saveInterval = null;
        this.paypal = {
            clientId: process.env.PAYPAL_CLIENT_ID || 'Aakv2h-LZrrB4V6yXFdkODvL5g0tm_oyrkGVPq0u_yXdYhyYkUUGQvW1eKalLqgQ5rozuwSPIzvcDtfS',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'ED6A_iSndfK2BatcojUs12iNsbjHWVUyodsqe6eiVfYYtnxcJxgbPBzTqa3P6KMdWXoSd_Ul4G0p1MFm',
            mode: 'sandbox',
            baseUrl: 'https://api-m.sandbox.paypal.com',
            price: 13.00,
            currency: 'USD'
        };
    }

    async load() {
        try {
            if (existsSync(this.tokensPath)) {
                const content = await fs.readFile(this.tokensPath, 'utf8');
                this.data = JSON.parse(content);
            }
            this.startAutoSave();
            logger.info('🎫 TokenService cargado');
        } catch (error: any) {
            logger.error('🎫 Error cargando tokens:', error.message);
        }
    }

    startAutoSave() {
        this.saveInterval = setInterval(() => {
            if (this.isDirty) {
                this.save();
            }
        }, 10000);
    }

    async save() {
        try {
            await fs.writeFile(this.tokensPath, JSON.stringify(this.data, null, 2));
            this.isDirty = false;
        } catch (error: any) {
            logger.error('🎫 Error guardando tokens:', error.message);
        }
    }

    markDirty() {
        this.isDirty = true;
    }

    generateTokenId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `TOKEN-${segment()}-${segment()}-${segment()}`;
    }

    createToken(userId: string, duration: string = '30d'): Token {
        const durationMs = this.parseDuration(duration);
        const token: Token = {
            id: this.generateTokenId(),
            userId: userId,
            createdAt: Date.now(),
            expiresAt: Date.now() + durationMs,
            duration: duration,
            used: false,
            usedBy: null,
            usedAt: null
        };
        this.data.tokens.push(token);
        this.markDirty();
        return token;
    }

    parseDuration(duration: string) {
        const match = duration.match(/^(\d+)(d|h|m)$/);
        if (!match) return 30 * 24 * 60 * 60 * 1000;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'm': return value * 60 * 1000;
            default: return 30 * 24 * 60 * 60 * 1000;
        }
    }

    validateToken(tokenId: string) {
        const token = this.data.tokens.find(t => t.id === tokenId);
        if (!token) {
            return { valid: false, error: 'Token no encontrado' };
        }
        if (token.used) {
            return { valid: false, error: 'Token ya fue usado' };
        }
        if (Date.now() > token.expiresAt) {
            return { valid: false, error: 'Token expirado' };
        }
        return { valid: true, token };
    }

    useToken(tokenId: string, userId: string) {
        const validation = this.validateToken(tokenId);
        if (!validation.valid) return validation;
        const token = validation.token!;
        token.used = true;
        token.usedBy = userId;
        token.usedAt = Date.now();
        this.markDirty();
        return { valid: true, token };
    }

    registerPrembot(userId: string, tokenId: string) {
        const token = this.data.tokens.find(t => t.id === tokenId);
        const durationMs = token ? this.parseDuration(token.duration) : (30 * 24 * 60 * 60 * 1000);
        const newExpiresAt = Date.now() + durationMs;

        const existing = this.data.prembots.find(p => p.userId === userId);
        if (existing) {
            existing.tokenId = tokenId;
            existing.connectedAt = Date.now();
            existing.expiresAt = newExpiresAt;
            existing.banned = false;
        } else {
            this.data.prembots.push({
                userId: userId,
                tokenId: tokenId,
                connectedAt: Date.now(),
                expiresAt: newExpiresAt,
                stats: { messages: 0, commands: 0, groups: 0 },
                limits: { groups: 50, chats: 200, commandsPerMin: 30 },
                commandHistory: [],
                banned: false,
                banReason: null,
                customName: null,
                customImage: null
            });
        }
        this.markDirty();
    }

    setPrembotName(userId: string, name: string) {
        const prembot = this.getPrembot(userId);
        if (!prembot) return { success: false, error: 'Prembot no encontrado' };
        prembot.customName = name;
        this.markDirty();
        return { success: true };
    }

    setPrembotImage(userId: string, imagePath: string) {
        const prembot = this.getPrembot(userId);
        if (!prembot) return { success: false, error: 'Prembot no encontrado' };
        prembot.customImage = imagePath;
        this.markDirty();
        return { success: true };
    }

    getPrembotConfig(userId: string) {
        const prembot = this.getPrembot(userId);
        if (!prembot) return null;
        return {
            customName: prembot.customName,
            customImage: prembot.customImage
        };
    }

    getTokenExpiry(tokenId: string) {
        const token = this.data.tokens.find(t => t.id === tokenId);
        return token ? token.expiresAt : Date.now();
    }

    getPrembot(userId: string) {
        return this.data.prembots.find(p => p.userId === userId);
    }

    isPrembotActive(userId: string) {
        const prembot = this.getPrembot(userId);
        if (!prembot) return false;
        if (prembot.banned) return false;
        if (Date.now() > prembot.expiresAt) return false;
        return true;
    }

    banPrembot(userId: string, reason: string = 'Comportamiento tóxico') {
        const prembot = this.getPrembot(userId);
        if (!prembot) return false;
        prembot.banned = true;
        prembot.banReason = reason;
        this.markDirty();
        return true;
    }

    unbanPrembot(userId: string) {
        const prembot = this.getPrembot(userId);
        if (!prembot) return false;
        prembot.banned = false;
        prembot.banReason = null;
        this.markDirty();
        return true;
    }

    updateStats(userId: string, field: 'messages' | 'commands' | 'groups') {
        const prembot = this.getPrembot(userId);
        if (!prembot) return;
        prembot.stats[field] = (prembot.stats[field] || 0) + 1;
        this.markDirty();
    }

    checkRateLimit(userId: string) {
        const prembot = this.getPrembot(userId);
        if (!prembot) return { allowed: false, error: 'Prembot no encontrado' };

        const now = Date.now();
        const oneMinAgo = now - 60000;
        prembot.commandHistory = prembot.commandHistory.filter(t => t > oneMinAgo);

        if (prembot.commandHistory.length >= prembot.limits.commandsPerMin) {
            return { allowed: false, error: 'Rate limit excedido (30 comandos/min)' };
        }

        prembot.commandHistory.push(now);
        this.markDirty();
        return { allowed: true };
    }

    getAllPrembots() {
        return this.data.prembots.map(p => ({
            userId: p.userId,
            connectedAt: p.connectedAt,
            expiresAt: p.expiresAt,
            stats: p.stats,
            banned: p.banned,
            daysRemaining: Math.max(0, Math.ceil((p.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
        }));
    }

    async getPayPalAccessToken() {
        if (!this.paypal.clientId || !this.paypal.clientSecret) {
            throw new Error('PayPal credentials not configured');
        }

        const auth = Buffer.from(`${this.paypal.clientId}:${this.paypal.clientSecret}`).toString('base64');
        const response = await fetch(`${this.paypal.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        const data: any = await response.json();
        return data.access_token;
    }

    async createPayPalOrder(userId: string) {
        try {
            const accessToken = await this.getPayPalAccessToken();
            const response = await fetch(`${this.paypal.baseUrl}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        amount: {
                            currency_code: this.paypal.currency,
                            value: this.paypal.price.toFixed(2)
                        },
                        description: 'Prembot Token - 30 días',
                        custom_id: userId
                    }],
                    application_context: {
                        brand_name: 'Alya Kujou Bot',
                        landing_page: 'BILLING',
                        user_action: 'PAY_NOW',
                        return_url: 'https://soblend-paypal.vercel.app/success',
                        cancel_url: 'https://soblend-paypal.vercel.app/error'
                    }
                })
            });

            const order: any = await response.json();
            this.data.payments.push({
                orderId: order.id,
                userId: userId,
                status: 'CREATED',
                createdAt: Date.now(),
                amount: this.paypal.price
            });
            this.markDirty();

            const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
            return { success: true, orderId: order.id, approvalUrl };
        } catch (error: any) {
            logger.error('PayPal Create Order Error:', error);
            return { success: false, error: error.message };
        }
    }

    async getPayPalOrder(orderId: string) {
        try {
            const accessToken = await this.getPayPalAccessToken();
            const response = await fetch(`${this.paypal.baseUrl}/v2/checkout/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            logger.error('PayPal Get Order Error:', error);
            return null;
        }
    }

    async capturePayPalOrder(orderId: string) {
        try {
            const accessToken = await this.getPayPalAccessToken();
            const response = await fetch(`${this.paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            let capture: any = await response.json();

            if (!response.ok) {
                const orderDetails: any = await this.getPayPalOrder(orderId);
                if (orderDetails && orderDetails.status === 'COMPLETED') {
                    capture = orderDetails;
                } else {
                    return { success: false, error: capture.message || 'Error capturando pago' };
                }
            }

            let payment = this.data.payments.find(p => p.orderId === orderId);

            if (!payment && capture.status === 'COMPLETED') {
                const userId = capture.purchase_units?.[0]?.custom_id || 'unknown';
                payment = {
                    orderId: orderId,
                    userId: userId,
                    status: 'COMPLETED',
                    createdAt: Date.now(),
                    capturedAt: Date.now(),
                    amount: parseFloat(capture.purchase_units?.[0]?.amount?.value || this.paypal.price)
                };
                this.data.payments.push(payment);
            }

            if (payment) {
                payment.status = capture.status;
                if (!payment.capturedAt) payment.capturedAt = Date.now();

                if (capture.status === 'COMPLETED' && !payment.tokenId) {
                    const token = this.createToken(payment.userId || 'unknown', '30d');
                    payment.tokenId = token.id;
                    logger.info(`Ticket recuperado/creado para ${payment.userId}: ${token.id}`);
                }
                this.markDirty();
            }

            return { success: capture.status === 'COMPLETED', capture };
        } catch (error: any) {
            logger.error('Capture Error:', error);
            return { success: false, error: error.message };
        }
    }

    getPayment(orderId: string) {
        return this.data.payments.find(p => p.orderId === orderId);
    }

    async gracefulShutdown() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        await this.save();
    }
}
export default TokenService;
