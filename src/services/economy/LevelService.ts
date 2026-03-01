export class LevelService {
    dbService: any;
    baseXp: number;
    multiplier: number;

    constructor(dbService: any) {
        this.dbService = dbService;
        this.baseXp = 100;
        this.multiplier = 1.5;
    }

    getXpForNextLevel(level: number): number {
        return Math.floor(this.baseXp * Math.pow(level, this.multiplier));
    }

    async addXp(userId: string, amount: number) {
        const user = await this.dbService.getUser(userId);
        if (!user.level) {
            user.level = { xp: 0, lvl: 1, lastXp: 0 };
        }
        user.level.xp += amount;
        let leveledUp = false;
        let nextLevelXp = this.getXpForNextLevel(user.level.lvl);
        while (user.level.xp >= nextLevelXp) {
            user.level.xp -= nextLevelXp;
            user.level.lvl++;
            leveledUp = true;
            nextLevelXp = this.getXpForNextLevel(user.level.lvl);
        }
        await this.dbService.updateUser(userId, { level: user.level });
        return {
            leveledUp,
            currentLevel: user.level.lvl,
            currentXp: user.level.xp,
            nextLevelXp
        };
    }

    async getLevel(userId: string) {
        const user = await this.dbService.getUser(userId);
        if (!user.level) return { xp: 0, lvl: 1, lastXp: 0 };
        return user.level;
    }

    async getRank(userId: string) {
        const user = await this.dbService.getUser(userId);
        const level = user.level || { xp: 0, lvl: 1 };
        const nextXp = this.getXpForNextLevel(level.lvl);
        return {
            level: level.lvl,
            xp: level.xp,
            required: nextXp,
            progress: Math.floor((level.xp / nextXp) * 100)
        };
    }
}
