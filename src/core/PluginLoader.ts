import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { globalLogger as logger } from '../utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PluginLoader {
    commandMap: Map<string, any>;
    beforeHandlers: any[];

    constructor() {
        this.commandMap = new Map();
        this.beforeHandlers = [];
    }

    async loadCommands(commandsDir: string) {
        logger.info(`ꕢ Iniciando carga de comandos desde ${commandsDir}...`);
        const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const rootFiles = fs.readdirSync(commandsDir)
            .filter(file => file.endsWith('.js') || file.endsWith('.ts'));

        let totalCommands = 0;

        for (const category of categories) {
            const categoryPath = path.join(commandsDir, category);
            const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

            for (const file of files) {
                try {
                    const filePath = pathToFileURL(path.join(categoryPath, file)).href;
                    await this.loadPlugin(filePath, file, category);
                    totalCommands++;
                } catch (error: any) {
                    logger.error(`ꕢ Error cargando ${category}/${file}:`, error.message);
                }
            }
        }

        for (const file of rootFiles) {
            try {
                const filePath = pathToFileURL(path.join(commandsDir, file)).href;
                await this.loadPlugin(filePath, file, 'general');
                totalCommands++;
            } catch (error: any) {
                logger.error(`ꕢ Error cargando ${file}:`, error.message);
            }
        }

        logger.info(`ꕣ ${totalCommands} comandos cargados exitosamente`);
        logger.info(`ꕣ ${this.commandMap.size} comandos registrados`);
        logger.info(`ꕣ ${this.beforeHandlers.length} before handlers registrados`);

        return {
            commandMap: this.commandMap,
            beforeHandlers: this.beforeHandlers
        };
    }

    async loadPlugin(filePath: string, fileName: string, category: string) {
        const plugin = await import(filePath);
        const pluginExport = plugin.default;

        if (!pluginExport || !pluginExport.commands) {
            logger.warn(`⚠ ${fileName} no tiene estructura válida de plugin`);
            return;
        }

        if (pluginExport.before && typeof pluginExport.before === 'function') {
            this.beforeHandlers.push({
                plugin: fileName,
                category,
                handler: pluginExport.before
            });
        }

        for (const cmd of pluginExport.commands) {
            if (this.commandMap.has(cmd)) {
                logger.warn(`⚠ Comando duplicado: ${cmd} (${fileName} sobrescribe comando existente)`);
            }
            this.commandMap.set(cmd, {
                execute: pluginExport.execute,
                plugin: fileName,
                category
            });
        }

        logger.info(`ꕣ [${category}] ${fileName} cargado`);
    }

    getCommand(commandName: string) {
        return this.commandMap.get(commandName);
    }

    getAllCommands() {
        return Array.from(this.commandMap.keys());
    }

    getCommandsByCategory(category: string) {
        const commands: string[] = [];
        for (const [cmd, data] of this.commandMap) {
            if (data.category === category) {
                commands.push(cmd);
            }
        }
        return commands;
    }
}
