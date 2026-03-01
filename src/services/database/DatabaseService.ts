import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { LocalDB } from '@imjxsx/localdb';
import User from '../../models/User.js';
import Group from '../../models/Group.js';
import { globalLogger as logger } from '../../utils/Logger.js';

const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const GROUP_CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

class TTLCache<V> {
    private map = new Map<string, { value: V; ts: number }>();
    constructor(private ttl: number, private maxSize: number) {}
    get(key: string): V | undefined {
        const entry = this.map.get(key);
        if (!entry) return undefined;
        if (Date.now() - entry.ts > this.ttl) { this.map.delete(key); return undefined; }
        return entry.value;
    }
    set(key: string, value: V): void {
        if (this.map.size >= this.maxSize) {
            const firstKey = this.map.keys().next().value;
            if (firstKey) this.map.delete(firstKey);
        }
        this.map.set(key, { value, ts: Date.now() });
    }
    delete(key: string): void { this.map.delete(key); }
    has(key: string): boolean {
        const entry = this.map.get(key);
        if (!entry) return false;
        if (Date.now() - entry.ts > this.ttl) { this.map.delete(key); return false; }
        return true;
    }
    keys(): IterableIterator<string> { return this.map.keys(); }
    get size(): number { return this.map.size; }
    clear(): void { this.map.clear(); }
}

const userCache = new TTLCache<any>(USER_CACHE_TTL, MAX_CACHE_SIZE);
const groupCache = new TTLCache<any>(GROUP_CACHE_TTL, MAX_CACHE_SIZE);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONGODB_URI = "mongodb+srv://Vercel-Admin-soblend-redzmey-spaceworkflow:SOquhfF8HTxqFcTw@soblend-redzmey-spacewo.7aubqkc.mongodb.net/?retryWrites=true&w=majority";

export class DatabaseService {
    isConnected: boolean;
    localDB: any;
    localUsers: any;
    localGroups: any;

    constructor() {
        this.isConnected = false;
        this.localDB = null;
        this.localUsers = null;
        this.localGroups = null;
    }

    async load() {
        try {
            await mongoose.connect(MONGODB_URI, {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4
            } as any);
            this.isConnected = true;
            logger.info('𖤐 Conectado a MongoDB (Pool: 10 conexiones)');
            await this.checkAndMigrate();
            return this;
        } catch (error: any) {
            logger.error('𖤐 Error conectando a MongoDB:', error.message);
            throw error;
        }
    }

    async checkAndMigrate() {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            logger.info('𖤐 MongoDB vacía. Iniciando migración desde LocalDB...');
            await this.migrateData();
        }
    }

    async migrateData() {
        try {
            const dbPath = path.join(__dirname, '..', '..', 'data');
            this.localDB = new LocalDB(dbPath).db('bot');
            await this.localDB.load();
            this.localUsers = this.localDB.collection('users');
            this.localGroups = this.localDB.collection('groups');
            const users = this.localUsers.find() || [];
            const groups = this.localGroups.find() || [];
            logger.info(`✨ Migrando ${users.length} usuarios y ${groups.length} grupos...`);
            if (users.length > 0) {
                const validUsers = users.filter((u: any) => u.id && !u.id.includes('undefined'));
                if (validUsers.length > 0) {
                    await (User as any).insertMany(validUsers, { ordered: false }).catch((e: any) => logger.warn('Partial user migration error:', e.message));
                }
            }
            if (groups.length > 0) {
                const validGroups = groups.filter((g: any) => g.id);
                if (validGroups.length > 0) {
                    await (Group as any).insertMany(validGroups, { ordered: false }).catch((e: any) => logger.warn('Partial group migration error:', e.message));
                }
            }
            logger.info('✅ Migración completada.');
        } catch (error) {
            logger.error('⚠️ Error durante la migración:', error);
        }
    }

    async save() {
        return true;
    }

    async getUser(userId: string, aliasId: string | null = null) {
        const cached = userCache.get(userId);
        if (cached) return cached;
        let user = await User.findOne({ id: userId }).lean();
        if (!user && aliasId) {
            let aliasUser = await User.findOne({ id: aliasId });
            if (!aliasUser && aliasId.includes('@lid')) {
                const lidAsSwa = aliasId.replace('@lid', '@s.whatsapp.net');
                aliasUser = await User.findOne({ id: lidAsSwa });
            }
            if (aliasUser) {
                logger.info(`✨ Migrating user data from ${aliasUser.id} to ${userId}`);
                await User.deleteOne({ id: (aliasUser as any).id });
                const userData = (aliasUser as any).toObject();
                delete userData._id;
                delete userData.__v;
                userData.id = userId;
                user = await User.create(userData);
                userCache.set(userId, user);
                return user as any;
            }
        }
        if (!user) {
            user = await User.create({
                id: userId,
                economy: { coins: 0, bank: 0, lastDaily: 0, lastWork: 0, lastCrime: 0, lastSlut: 0 },
                gacha: { characters: [], lastClaim: 0, votes: {} },
                stats: { messages: 0, commands: 0 },
                level: { xp: 0, lvl: 1, lastXp: 0 },
                inventory: [],
                createdAt: Date.now(),
                monedas: 0,
                antirobo: 0,
                desbloqueo: 0
            });
        }
        userCache.set(userId, user);
        return user as any;
    }

    async updateUser(userId: string, updates: any) {
        userCache.delete(userId);
        if (userId.includes('@s.whatsapp.net')) {
            const phoneNumber = userId.split('@')[0];
            for (const key of userCache.keys()) {
                if (key.startsWith(phoneNumber) && key.includes('@lid')) {
                    userCache.delete(key);
                }
            }
        }
        if (userId.includes('@lid')) {
            const phoneNumber = userId.split('@')[0].split(':')[0];
            userCache.delete(`${phoneNumber}@s.whatsapp.net`);
        }
        const result = await User.findOneAndUpdate(
            { id: userId },
            { $set: updates },
            { upsert: true, returnDocument: 'after' }
        ).lean();
        return result;
    }

    async getUserEconomyRank(userId: string) {
        const user = await this.getUser(userId);
        if (!user) return -1;
        const totalCoins = (user.economy?.coins || 0) + (user.economy?.bank || 0);
        const rank = await User.countDocuments({
            $expr: {
                $gt: [
                    { $add: ['$economy.coins', '$economy.bank'] },
                    totalCoins
                ]
            }
        });
        return rank + 1;
    }

    async getLeaderboard(limit: number = 10) {
        return User.aggregate([
            { $addFields: { totalCoins: { $add: ['$economy.coins', '$economy.bank'] } } },
            { $sort: { totalCoins: -1 } },
            { $limit: limit }
        ]);
    }

    async getGroup(groupId: string) {
        const cached = groupCache.get(groupId);
        if (cached) return cached;
        let group = await (Group as any).findOne({ id: groupId }).lean();
        if (!group) {
            group = await (Group as any).create({
                id: groupId,
                settings: {
                    welcome: false,
                    goodbye: false,
                    antilink: false,
                    economy: true,
                    nsfw: false,
                    alerts: false,
                    currencyName: 'coins'
                },
                alerts: [],
                stats: { messages: 0 },
                primaryBot: null
            });
        }
        groupCache.set(groupId, group);
        return group as any;
    }

    async updateGroup(groupId: string, updates: any) {
        groupCache.delete(groupId);
        const result = await (Group as any).findOneAndUpdate(
            { id: groupId },
            { $set: updates },
            { upsert: true, returnDocument: 'after' }
        ).lean();
        groupCache.set(groupId, result);
        return result;
    }

    async getAllGroups() {
        return (Group as any).find({}).lean();
    }

    async deleteUser(userId: string) {
        userCache.delete(userId);
        if (userId.includes('@s.whatsapp.net')) {
            const phoneNumber = userId.split('@')[0];
            for (const key of userCache.keys()) {
                if (key.startsWith(phoneNumber) && key.includes('@lid')) {
                    userCache.delete(key);
                }
            }
        }

        if (userId.includes('@lid')) {
            const phoneNumber = userId.split('@')[0].split(':')[0];
            userCache.delete(`${phoneNumber}@s.whatsapp.net`);
        }

        return User.deleteOne({ id: userId });
    }

    async deleteGroup(groupId: string) {
        groupCache.delete(groupId);
        return (Group as any).deleteOne({ id: groupId });
    }

    async getCacheStats() {
        return {
            users: { size: userCache.size },
            groups: { size: groupCache.size }
        };
    }

    async getUserCount() {
        return User.countDocuments();
    }

    async getStats() {
        const [userCount, groupCount] = await Promise.all([
            User.countDocuments(),
            (Group as any).countDocuments()
        ]);
        return { users: userCount, groups: groupCount };
    }

    async gracefulShutdown() {
        userCache.clear();
        groupCache.clear();
        await mongoose.disconnect();
        logger.info('𖤐 Desconectado de MongoDB');
    }

    markDirty() {
        return true;
    }

    async getTopUsers(limit: number = 10) {
        try {
            const users = await User.find({})
                .select('id name economy')
                .lean()
                .exec();
            const usersWithTotal = users.map((user: any) => {
                const coins = user.economy?.coins || 0;
                const bank = user.economy?.bank || 0;
                return {
                    id: user.id,
                    name: user.name || 'Usuario',
                    coins: coins,
                    bank: bank,
                    total: coins + bank
                };
            });
            usersWithTotal.sort((a, b) => b.total - a.total);
            return usersWithTotal.slice(0, limit);
        } catch (error) {
            logger.error('[DatabaseService] Error getting top users:', error);
            return [];
        }
    }
}

export default DatabaseService;
