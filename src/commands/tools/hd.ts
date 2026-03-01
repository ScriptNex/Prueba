import axios from 'axios';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

async function getToken() {
    const html = await axios.get('https://www.iloveimg.com/upscale-image', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(html.data);
    const script = $('script')
        .filter((i, el) => $(el).html()?.includes('ilovepdfConfig =') || false)
        .html();
    if (!script) throw new Error('No se encontró ilovepdfConfig');
    const jsonS = script.split('ilovepdfConfig = ')[1].split(';')[0];
    const json = JSON.parse(jsonS);
    const csrf = $('meta[name="csrf-token"]').attr('content');
    return { token: json.token, csrf };
}

async function uploadImage(server: string, headers: any, buffer: Buffer, task: string) {
    const form = new FormData();
    form.append('name', 'image.jpg');
    form.append('chunk', '0');
    form.append('chunks', '1');
    form.append('task', task);
    form.append('preview', '1');
    form.append('file', buffer, 'image.jpg');
    const res = await axios.post(`https://${server}.iloveimg.com/v1/upload`, form, {
        headers: { ...headers, ...form.getHeaders() },
    });
    return res.data;
}

async function hdr(buffer: Buffer, scale = 4) {
    const { token, csrf } = await getToken();
    const servers = [
        'api1g', 'api2g', 'api3g', 'api8g', 'api9g', 'api10g', 'api11g', 'api12g', 'api13g',
        'api14g', 'api15g', 'api16g', 'api17g', 'api18g', 'api19g', 'api20g', 'api21g',
        'api22g', 'api24g', 'api25g'
    ];
    const server = servers[Math.floor(Math.random() * servers.length)];
    const task = 'r68zl88mq72xq94j2d5p66bn2z9lrbx20njsbw2qsAvgmzr11lvfhAx9kl87pp6yqgx7c8vg7sfbqnrr42qb16v0gj8jl5s0kq1kgp26mdyjjspd8c5A2wk8b4Adbm6vf5tpwbqlqdr8A9tfn7vbqvy28ylphlxdl379psxpd8r70nzs3sk1';
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Origin': 'https://www.iloveimg.com/',
        'Cookie': '_csrf=' + csrf,
        'User-Agent': 'Mozilla/5.0',
    };
    const upload = await uploadImage(server, headers, buffer, task);
    const form = new FormData();
    form.append('task', task);
    form.append('server_filename', upload.server_filename);
    form.append('scale', scale);
    const res = await axios.post(`https://${server}.iloveimg.com/v1/upscale`, form, {
        headers: { ...headers, ...form.getHeaders() },
        responseType: 'arraybuffer',
        validateStatus: null
    });
    const contentType = res.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
        const json = JSON.parse(Buffer.from(res.data).toString());
        logger.error('Error del servidor iloveimg:', json);
        throw new Error('No se pudo generar la imagen HD.');
    }
    return res.data;
}

const command: Command = {
    commands: ['hd', 'remini', 'enhance'],
    tags: ['tools'],
    help: ['hd (responde a una imagen)'],
    async execute(ctx: CommandContext) {
        const { msg, bot, reply, chatId } = ctx;
        const msgAny: any = msg;
        const quotedContent = msgAny.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedMsg = quotedContent ? { message: quotedContent } : null;
        const isImage = msgAny.message?.imageMessage;
        const isQuotedImage = quotedContent?.imageMessage;

        if (!isImage && !isQuotedImage) {
            return await reply(styleText('ꕢ Por favor responde a una imagen o envía una imagen con el comando.'));
        }

        try {
            await reply(styleText('ꕢ Mejorando calidad de imagen... (esto puede tardar unos segundos)'));
            const messageToDownload: any = quotedMsg || msg;
            const buffer = await downloadMediaMessage(
                messageToDownload,
                'buffer',
                {},
                { 
                    logger: console as any, 
                    reuploadRequest: bot?.sock.updateMediaMessage 
                }
            ) as Buffer;
            
            const resultBuffer = await hdr(buffer);
            await bot?.sock.sendMessage(chatId, {
                image: resultBuffer,
                caption: styleText('ꕣ Imagen mejorada con éxito.')
            }, { quoted: msg as any });
        } catch (error) {
            logger.error('[HD] Error:', error);
            await reply(styleText('ꕢ Ocurrió un error al procesar la imagen. Intenta más tarde.'));
        }
    }
};

export default command;
