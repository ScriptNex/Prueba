import { Bot as WapiBot, LocalAuth } from '@imjxsx/wapi';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import { PluginLoader } from './PluginLoader';
import DatabaseService from '../services/database/DatabaseService';
import GachaService from '../services/gacha/GachaService';
import CacheManager from '../utils/CacheManager';
import TokenService from '../services/auth/TokenService';
import PrembotManager from '../services/auth/PrembotManager';
import { ShopService } from '../services/economy/ShopService';
import { LevelService } from '../services/economy/LevelService';
import { EconomySeasonService } from '../services/economy/EconomySeasonService';
import { MessageHandler } from '../handlers/MessageHandler';
import { WelcomeHandler } from '../handlers/WelcomeHandler';
import { AlertHandler } from '../handlers/AlertHandler';
import memoryManager from '../utils/MemoryManager';
import { jadibotManager } from '../services/external/jadibot';
import * as SafeDownloader from '../services/media/SafeDownloader';
import { globalLogger as logger } from '../utils/Logger';
import { clearPermissionCache } from '../utils/permissions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Bot {
    config: any;
    services: any;
    bot: any;
    pluginLoader: PluginLoader;
    logger: any;

    constructor(config: any = {}) {
        this.config = {
            uuid: config.uuid || '1f1332f4-7c2a-4b88-b4ca-bd56d07ed713',
            sessionsDir: config.sessionsDir || 'sessions',
            commandsDir: config.commandsDir || path.join(__dirname, '..', 'commands'),
            ownerJid: config.ownerJid || '639972367773@s.whatsapp.net',
            prefix: config.prefix || '#',
            ...config
        };
        this.services = {};
        this.bot = null;
        this.pluginLoader = new PluginLoader();
        this.logger = { level: 'info' };
    }

    async initializeServices() {
        logger.info('ꕢ Inicializando servicios...');
        this.services.dbService = new DatabaseService();
        this.services.gachaService = new GachaService();
        this.services.cacheManager = new CacheManager();
        this.services.tokenService = new TokenService();
        this.services.prembotManager = new PrembotManager(this.services.tokenService);
        this.services.shopService = new ShopService(this.services.dbService);
        this.services.levelService = new LevelService(this.services.dbService);
        this.services.economySeasonService = new EconomySeasonService(this.services.dbService);
        (global as any).db = await this.services.dbService.load();
        Object.assign(global, {
            dbService: this.services.dbService,
            gachaService: this.services.gachaService,
            cacheManager: this.services.cacheManager,
            tokenService: this.services.tokenService,
            prembotManager: this.services.prembotManager,
            shopService: this.services.shopService,
            levelService: this.services.levelService,
            economySeasonService: this.services.economySeasonService,
            memoryManager: memoryManager,
            SafeDownloader: SafeDownloader
        });
        memoryManager.on('critical', () => SafeDownloader.purgeAllTempFiles());
        memoryManager.on('cleanup', () => SafeDownloader.cleanupTempFiles());
        SafeDownloader.purgeAllTempFiles();
        await Promise.all([
            this.services.gachaService.load(),
            this.services.tokenService.load()
        ]);
    }

    async loadCommands() {
        const { commandMap, beforeHandlers } = await this.pluginLoader.loadCommands(this.config.commandsDir);
        (global as any).commandMap = commandMap;
        (global as any).beforeHandlers = beforeHandlers;
        return { commandMap, beforeHandlers };
    }

    async initializeBot() {
        const auth = new LocalAuth(this.config.uuid, this.config.sessionsDir);
        const account = { jid: '', pn: '', name: '' };
        this.bot = new WapiBot(this.config.uuid, auth, account);
        this.bot.logger.level = this.logger.level || 'error';
        const messageHandler = new MessageHandler(
            this.services.dbService,
            this.services.gachaService,
            null,
            null,
            this.services.cacheManager,
            this.services.shopService,
            this.services.levelService,
            this.services.economySeasonService
        );
        const welcomeHandler = new WelcomeHandler(this.services.dbService);
        const alertHandler = new AlertHandler(this.services.dbService);
        (global as any).messageHandler = messageHandler;
        this.setupEventHandlers(messageHandler, welcomeHandler, alertHandler);
    }

    setupEventHandlers(messageHandler: any, welcomeHandler: any, alertHandler: any) {
        this.bot.on('qr', async (qr: string) => {
            const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
            console.log(qrString);
        });
        this.bot.on('open', (account: any) => {
            (global as any).mainBot = this.bot;
            this.services.prembotManager.loadSessions(this.bot).catch((e: any) => logger.error(e));
            jadibotManager.loadSessions(this.bot).catch((e: any) => logger.error(e));
            this.bot.ws.ev.on('messages.upsert', ({ messages }: { messages: any[] }) => {
                for (const m of messages) messageHandler.handleMessage(this.bot, m).catch((err: any) => logger.error(err));
            });
            this.bot.ws.ev.on('group-participants.update', (event: any) => {
                clearPermissionCache(event.id);
                welcomeHandler.handle(this.bot, event).catch((err: any) => logger.error(err));
                alertHandler.handle(this.bot, event).catch((err: any) => logger.error(err));
            });
        });
        this.bot.on('close', () => {});
        this.bot.on('error', (err: any) => logger.error(err));
    }

    setupGracefulShutdown() {
        const gracefulShutdown = async () => {
            memoryManager.stop();
            SafeDownloader.cleanupTempFiles();
            await this.services.dbService.gracefulShutdown();
            await this.services.gachaService.gracefulShutdown();
            await this.services.tokenService.gracefulShutdown();
            process.exit(0);
        };
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        process.on('uncaughtException', async (err: any) => {
            if (err.code === 'ENOSPC') SafeDownloader.purgeAllTempFiles();
        });
        process.on('unhandledRejection', async (reason: any) => {
            if (reason?.code === 'ENOSPC') SafeDownloader.purgeAllTempFiles();
        });
    }

    async start() {
        await this.bot.login('qr');
    }

    async initialize() {
        await this.initializeServices();
        await this.loadCommands();
        await this.initializeBot();
        this.setupGracefulShutdown();
    }

    async initializeWorker() {
        await this.initializeServices();
        await this.loadCommands();
        const messageHandler = new MessageHandler(
            this.services.dbService,
            this.services.gachaService,
            null,
            null,
            this.services.cacheManager,
            this.services.shopService,
            this.services.levelService,
            this.services.economySeasonService
        );
        (global as any).messageHandler = messageHandler;
        const { CLUSTER_CONFIG } = await import('../config/nodes');
        const { WorkerServer } = await import('../services/cluster/WorkerServer');
        const worker = new WorkerServer();
        await worker.start(CLUSTER_CONFIG.port);
        jadibotManager.loadSessions(null).catch((e: any) => logger.error(e));
        this.setupGracefulShutdown();
    }
}
