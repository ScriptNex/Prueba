import fs from 'fs';
import { styleText } from '../../utils/helpers.js';
import { DATA_PATHS } from '../../config/data.js';
import { Command, CommandContext } from '../../types/Command.js';

const OWNER_NUMBER = '573115434166';

const command: Command = {
    commands: ['addrw', 'addwaifu'],
    async execute(ctx: CommandContext) {
        const { sender, args, reply, gachaService } = ctx;
        const senderNumber = sender.split('@')[0].split(':')[0];
        
        if (senderNumber !== OWNER_NUMBER) {
            return await reply(styleText('ꕢ Solo el owner puede usar este comando.'));
        }

        const fullArgs = args.join(' ');
        const parts = fullArgs.split('|').map(p => p.trim());
        
        if (parts.length < 5) {
            return await reply(styleText(
                `ꕢ *Uso incorrecto*\n\n` +
                `Formato: #addrw name | gender | value | source | img | vid\n\n` +
                `*Ejemplo:*\n` +
                `#addrw Naruto | Hombre | 1800 | Naruto Shippuden | https://img1.jpg,https://img2.jpg | https://vid1.mp4`
            ));
        }

        const [name, gender, valueStr, source, imgUrls, vidUrls] = parts;
        const value = parseInt(valueStr);
        
        if (!name || !gender || isNaN(value) || !source || !imgUrls) {
            return await reply(styleText('ꕢ Faltan campos obligatorios (name, gender, value, source, img).'));
        }

        const img = imgUrls.split(',').map(url => url.trim()).filter(Boolean);
        const vid = vidUrls ? vidUrls.split(',').map(url => url.trim()).filter(Boolean) : [];
        
        const gachaPath = DATA_PATHS.CHARACTERS;
        let gachaData;
        
        try {
            const fileContent = await fs.promises.readFile(gachaPath, 'utf8');
            gachaData = JSON.parse(fileContent);
        } catch (error) {
            return await reply(styleText('ꕢ Error al leer gacha.json'));
        }

        const maxId = Math.max(...gachaData.characters.map((c: any) => parseInt(c.id) || 0), 0);
        const newId = String(maxId + 1);

        const newCharacter = {
            id: newId,
            name: name,
            gender: gender,
            value: value,
            source: source,
            img: img,
            vid: vid,
            user: null,
            status: 'Libre',
            votes: 0
        };

        gachaData.characters.push(newCharacter);

        try {
            await fs.promises.writeFile(gachaPath, JSON.stringify(gachaData, null, 2), 'utf8');
        } catch (error) {
            return await reply(styleText('ꕢ Error al guardar gacha.json'));
        }

        if (gachaService) {
            gachaService.characters.push(newCharacter as any);
            gachaService.indexCharacters();
        }

        await reply(styleText(
            `ꕣ *Personaje agregado exitosamente*\n\n` +
            `> ID: ${newId}\n` +
            `> Nombre: ${name}\n` +
            `> Género: ${gender}\n` +
            `> Valor: ¥${value}\n` +
            `> Fuente: ${source}\n` +
            `> Imágenes: ${img.length}\n` +
            `> Videos: ${vid.length}`
        ));
    }
};

export default command;
