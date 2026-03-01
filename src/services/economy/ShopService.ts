import { globalLogger as logger } from '../../utils/Logger.js';
import { DatabaseService } from '../database/DatabaseService.js';

export class ShopService {
    dbService: DatabaseService;
    items: Map<string, any>;
    stock: Map<string, number>;
    stockInterval: NodeJS.Timeout | null;
    CATEGORIES: {
        CONSUMABLE: string;
        TOOL: string;
        COLLECTIBLE: string;
        POWERUP: string;
        SPECIAL: string;
    };

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
        this.items = new Map();
        this.stock = new Map();
        this.stockInterval = null;
        this.CATEGORIES = {
            CONSUMABLE: 'Consumible',
            TOOL: 'Herramienta',
            COLLECTIBLE: 'Coleccionable',
            POWERUP: 'Potenciador',
            SPECIAL: 'Especial'
        };
        this.initializeItems();
        this.startStockRotation();
    }

    initializeItems() {
        const add = (id: string, name: string, price: number, desc: string, category: string, effect: any = {}) => {
            this.items.set(id, { id, name, price, desc, category, effect });
        };

        const potions = ['Vida', 'Maná', 'Energía', 'Suerte', 'Rapidez'];
        const potionLevels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        potions.forEach(type => {
            potionLevels.forEach((lvl, idx) => {
                const power = (idx + 1) * 10;
                add(
                    `pot_${type.toLowerCase()}_${idx + 1}`,
                    `Poción de ${type} ${lvl}`,
                    100 * (idx + 1),
                    `Resturara ${power}% de ${type.toLowerCase()}`,
                    this.CATEGORIES.CONSUMABLE,
                    { type: 'restore', stat: type.toLowerCase(), amount: power }
                );
            });
        });

        const foods = ['Manzana', 'Pan', 'Carne', 'Pescado', 'Pastel', 'Sushi', 'Pizza', 'Hamburguesa', 'Taco', 'Helado'];
        foods.forEach((food, idx) => {
            add(`food_${idx}`, food, 50 * (idx + 1), `Delicioso ${food}`, this.CATEGORIES.CONSUMABLE);
        });

        const materials = ['Madera', 'Piedra', 'Hierro', 'Oro', 'Diamante', 'Obsidiana', 'Esmeralda', 'Rubí', 'Zafiro', 'Netherite'];
        const tools = ['Pico', 'Hacha', 'Espada', 'Pala', 'Azada'];

        materials.forEach((mat, mIdx) => {
            tools.forEach((tool, tIdx) => {
                add(
                    `tool_${mat.toLowerCase()}_${tool.toLowerCase()}`,
                    `${tool} de ${mat}`,
                    500 * (mIdx + 1),
                    `Herramienta de nivel ${mIdx + 1}`,
                    this.CATEGORIES.TOOL,
                    { type: 'tool', level: mIdx + 1 }
                );
            });
        });

        for (let i = 1; i <= 50; i++) {
            add(`figura_${i}`, `Figura Coleccionable #${i}`, 1000 * i, `Figura rara número ${i}`, this.CATEGORIES.COLLECTIBLE);
        }

        for (let i = 1; i <= 30; i++) {
            add(
                `xp_boost_${i}`,
                `Potenciador de XP x${(1 + i * 0.1).toFixed(1)}`,
                2000 * i,
                `Multiplica tu XP por ${(1 + i * 0.1).toFixed(1)} durante 30m`,
                this.CATEGORIES.POWERUP,
                { type: 'multiplier', stat: 'xp', value: 1 + i * 0.1, duration: 1800 }
            );
        }

        const specials = [
            { name: 'Ticket Gacha', price: 5000 },
            { name: 'Pase VIP (1d)', price: 10000 },
            { name: 'Pase VIP (7d)', price: 50000 },
            { name: 'Cambio de Nombre', price: 2000 },
            { name: 'Reset Stats', price: 50000 },
            { name: 'Caja Misteriosa', price: 1500 },
            { name: 'Llave Maestra', price: 8000 },
            { name: 'Piedra Filosofal', price: 100000 },
            { name: 'Anillo Unico', price: 500000 },
            { name: 'Estrella Fugaz', price: 25000 }
        ];

        specials.forEach((s, idx) => {
            add(`special_${idx}`, s.name, s.price, 'Objeto especial muy raro', this.CATEGORIES.SPECIAL);
        });

        logger.info(`🛒 ShopService: ${this.items.size} ítems cargados.`);
    }

    startStockRotation() {
        this.rotateStock();
        this.stockInterval = setInterval(() => {
            this.rotateStock();
        }, 5 * 60 * 1000);
    }

    rotateStock() {
        this.stock.clear();
        logger.info('🔄 Rotando stock de la tienda...');
        for (const [id, item] of this.items) {
            if (Math.random() > 0.3) {
                const quantity = Math.floor(Math.random() * 50) + 1;
                this.stock.set(id, quantity);
            }
        }
    }

    getItems(page: number = 1, limit: number = 10, category: string | null = null) {
        let allItems = Array.from(this.items.values());
        if (category) {
            allItems = allItems.filter(i => i.category === category);
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const pageItems = allItems.slice(start, end);

        return {
            items: pageItems.map(i => ({
                ...i,
                stock: this.stock.get(i.id) || 0
            })),
            total: allItems.length,
            totalPages: Math.ceil(allItems.length / limit),
            currentPage: page
        };
    }

    getItem(id: string) {
        const item = this.items.get(id);
        if (!item) return null;
        return {
            ...item,
            stock: this.stock.get(id) || 0
        };
    }

    async buyItem(userId: string, itemId: string, quantity: number = 1) {
        const item = this.items.get(itemId);
        if (!item) return { success: false, error: 'Item no encontrado' };

        const currentStock = this.stock.get(itemId) || 0;
        if (currentStock < quantity) return { success: false, error: `Stock insuficiente (Disponible: ${currentStock})` };

        const user = await this.dbService.getUser(userId);
        const totalCost = item.price * quantity;

        if ((user.economy?.coins || 0) < totalCost) {
            return { success: false, error: `Fondos insuficientes. Necesitas ${totalCost} coins.` };
        }

        await this.dbService.updateUser(userId, {
            'economy.coins': user.economy.coins - totalCost
        });

        if (!user.inventory) user.inventory = [];
        const existingItemIndex = user.inventory.findIndex((i: any) => i.id === itemId);

        if (existingItemIndex >= 0) {
            user.inventory[existingItemIndex].count += quantity;
        } else {
            user.inventory.push({ id: itemId, count: quantity, acquiredAt: Date.now() });
        }

        await this.dbService.updateUser(userId, { inventory: user.inventory });
        this.stock.set(itemId, currentStock - quantity);

        return { success: true, item, remainingBalance: user.economy.coins - totalCost };
    }

    async getInventory(userId: string) {
        const user = await this.dbService.getUser(userId);
        if (!user.inventory) return [];

        return user.inventory.map((slot: any) => {
            const itemDef = this.items.get(slot.id);
            return {
                ...slot,
                name: itemDef ? itemDef.name : 'Item Desconocido',
                desc: itemDef ? itemDef.desc : '',
                category: itemDef ? itemDef.category : 'Otros'
            };
        });
    }

    gracefulShutdown() {
        if (this.stockInterval) clearInterval(this.stockInterval);
    }
}
