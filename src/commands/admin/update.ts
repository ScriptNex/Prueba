import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
    commands: ['update', 'reload'],
    tags: ['owner'],
    help: ['update (recarga todos los plugins)'],
    async execute(ctx: CommandContext) {
        const { reply, sender, isOwner } = ctx;
        
        if (!isOwner && !sender.includes('573115434166')) {
            return await reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }

        try {
            await reply(styleText('ꕣ Iniciando recarga de sistema... 🔄'));
            
            // Accessing global variables (typed as any for now or imported if available)
            const globalAny = global as any;
            if (globalAny.commandMap) globalAny.commandMap.clear();
            globalAny.beforeHandlers = [];

            // We scan the categories
            const commandsDir = path.join(__dirname, '..');
            const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            let successCount = 0;
            let failCount = 0;

            for (const category of categories) {
                const categoryPath = path.join(commandsDir, category);
                const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
                
                for (const file of files) {
                    try {
                        const filePath = pathToFileURL(path.join(categoryPath, file)).href + '?update=' + Date.now();
                        const plugin = await import(filePath);
                        const pluginExport = plugin.default;
                        
                        if (pluginExport && pluginExport.commands) {
                            if (pluginExport.before && typeof pluginExport.before === 'function') {
                                globalAny.beforeHandlers.push({ plugin: `${category}/${file}`, handler: pluginExport.before });
                            }
                            for (const cmd of pluginExport.commands) {
                                globalAny.commandMap.set(cmd, { execute: pluginExport.execute, plugin: `${category}/${file}` });
                            }
                            successCount++;
                        }
                    } catch (err) {
                        console.error(`Error recargando ${category}/${file}: `, err);
                        failCount++;
                    }
                }
            }

            await reply(styleText(`✅ * Sistema Actualizado *\n\n📦 Plugins recargados: ${successCount} \n❌ Fallos: ${failCount} \n⚙️ Comandos activos: ${globalAny.commandMap.size} `));
        } catch (error) {
            console.error('Update Error:', error);
            await reply(styleText('❌ Error crítico al actualizar el sistema.'));
        }
    }
};

export default command;
