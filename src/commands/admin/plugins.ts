import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command, CommandContext } from '../../types/Command.js';
import { styleText } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
    commands: ['plugins', 'getplugin'],
    tags: ['owner'],
    help: ['plugins', 'getplugin <nombre>'],
    async execute(ctx: CommandContext) {
        const { args, command: cmdName, reply, sender, isOwner, bot } = ctx;
        
        // Owner check
        if (!isOwner && !sender.includes('573115434166')) {
            return await reply(styleText('ꕢ Solo el owner puede usar este comando.'));
        }

        if (cmdName === 'plugins') {
            try {
                // Now filtering for .ts files as we migrated
                const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
                let text = `ꕣ *Lista de Plugins* (${files.length})\n\n`;
                files.sort().forEach((file, index) => {
                    text += `> ${index + 1}. ${file}\n`;
                });
                text += `\n> Usa */getplugin <nombre>* para obtener el archivo.`;
                return await reply(styleText(text));
            } catch (error) {
                console.error(error);
                return await reply(styleText('ꕢ Error al leer la carpeta de plugins.'));
            }
        }

        if (cmdName === 'getplugin') {
            if (!args[0]) {
                return await reply(styleText('ꕢ Ingresa el nombre del plugin.\n> Ejemplo: */getplugin admin-test.ts*'));
            }
            
            let pluginName = args[0];
            const filePath = path.join(__dirname, pluginName);
            const fallbackPath = pluginName.endsWith('.ts') ? filePath : path.join(__dirname, pluginName + '.ts');
            const jsFallbackPath = pluginName.endsWith('.js') ? filePath : path.join(__dirname, pluginName + '.js');

            let finalPath = '';
            if (fs.existsSync(filePath)) finalPath = filePath;
            else if (fs.existsSync(fallbackPath)) finalPath = fallbackPath;
            else if (fs.existsSync(jsFallbackPath)) finalPath = jsFallbackPath;

            if (!finalPath) {
                return await reply(styleText(`❌ El plugin *${pluginName}* no existe.`));
            }

            try {
                const fileName = path.basename(finalPath);
                await bot.sendMessage(ctx.chatId, { 
                    document: fs.readFileSync(finalPath), 
                    mimetype: finalPath.endsWith('.ts') ? 'text/typescript' : 'text/javascript', 
                    fileName: fileName, 
                    caption: styleText(`ꕣ *Plugin:* ${fileName}`) 
                }, { quoted: ctx.msg });
            } catch (error) {
                console.error(error);
                return await reply(styleText('❌ Error al enviar el archivo.'));
            }
        }
    }
};

export default command;
