import { DATA_PATHS } from '../../config/data.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { globalLogger as logger } from '../../utils/Logger.js';
import { DatabaseService } from '../database/DatabaseService.js';

export class EconomySeasonService {
    dbService: DatabaseService;
    seasonPath: string;
    seasonData: {
        name: string;
        active: boolean;
        startDate: number;
        endDate: number;
        participants: any[];
    };

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
        this.seasonPath = DATA_PATHS.ECONOMY_SEASON || 'src/data/season.json';
        this.seasonData = {
            name: 'Temporada Beta',
            active: true,
            startDate: Date.now(),
            endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), 
            participants: []
        };
    }

    async load() {
        try {
            if (existsSync(this.seasonPath)) {
                const data = await fs.readFile(this.seasonPath, 'utf8');
                this.seasonData = JSON.parse(data);
            } else {
                await this.save();
            }
            logger.info('ꕣ EconomySeasonService cargado');
        } catch (error) {
            logger.error('Error loading season data:', error);
        }
    }

    async save() {
        try {
            await fs.writeFile(this.seasonPath, JSON.stringify(this.seasonData, null, 2));
        } catch (error) {
            logger.error('Error saving season data:', error);
        }
    }

    async getSeasonLeaderboard(limit: number = 10) {
        // En MongoDB, usamos getTopUsers de DatabaseService para mejorar performance
        const users = await this.dbService.getTopUsers(limit);
        return users.map(u => ({
            id: u.id,
            coins: u.coins
        }));
    }

    async getUserRank(userId: string) {
        const rank = await this.dbService.getUserEconomyRank(userId);
        const totalUsers = await this.dbService.getUserCount();

        if (rank === -1) return { rank: null, percentile: null };

        const percentile = Math.floor((rank / totalUsers) * 100);
        return { rank, percentile };
    }

    async getSeasonStats() {
        const now = Date.now();
        const timeLeft = Math.max(0, this.seasonData.endDate - now);

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const stats = await this.dbService.getStats();
        // Nota: totalCoins no está disponible directamente en los stats rápidos de Mongo
        // Se podría agregar si es necesario con una agregación
        
        return {
            name: this.seasonData.name,
            timeRemaining: {
                expired: timeLeft === 0,
                days,
                hours
            },
            participants: stats.users,
            totalCoins: 0, // Omitido por performance en Mongo
            averageCoins: 0
        };
    }
}
