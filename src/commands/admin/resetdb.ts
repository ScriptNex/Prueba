import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
    commands: ['resetdb', 'cleardb'],
    tags: ['owner'],
    help: ['resetdb (BORRA TODOS LOS DATOS)'],
    async execute(ctx: CommandContext) {
        const { sender, dbService, reply, isOwner } = ctx;
        
        if (!isOwner && !sender.includes('573115434166')) {
            return await reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }

        try {
            await reply(styleText('⚠️ *ADVERTENCIA*: Iniciando borrado completo de base de datos... ⚠️'));
            
            // Adjusting path to match new structure
            const dbPath = path.join(__dirname, '..', '..', '..', 'src', 'database');
            const dataPath = path.join(__dirname, '..', '..', '..', 'data');
            const timestamp = Date.now();

            // Backup existing files if they exist
            ['users.json', 'groups.json'].forEach(file => {
                const fullPath = path.join(dataPath, file);
                if (fs.existsSync(fullPath)) {
                    fs.copyFileSync(fullPath, path.join(dataPath, `${path.parse(file).name}_backup_${timestamp}.json`));
                }
            });

            // For LocalDB migration - we clear the collections
            if (dbService.users && typeof dbService.users.deleteMany === 'function') {
                await dbService.users.deleteMany({});
            }
            if (dbService.groups && typeof dbService.groups.deleteMany === 'function') {
                await dbService.groups.deleteMany({});
            }

            // Also overwrite JSON files in data directory to be safe
            fs.writeFileSync(path.join(dataPath, 'users.json'), '[]');
            fs.writeFileSync(path.join(dataPath, 'groups.json'), '[]');

            await dbService.load();
            
            await reply(styleText(`✅ *Base de datos reseteada*\n\n🗑️ Archivos limpiados.\n📦 Backup automático creado: _${timestamp}_`));
        } catch (error) {
            console.error('ResetDB Error:', error);
            await reply(styleText('❌ Error al resetear la base de datos.'));
        }
    }
};

export default command;
