import { fileURLToPath } from 'url';
import path from 'path';
import { PREFIXES, RATE_LIMIT, ERRORS } from '../config/constants.js';
import { styleText, isOwner } from '../utils/helpers.js';
import { globalLogger as logger } from '../utils/Logger.js';

let wapiModule: any = null;
const getWapi = async () => {
    if (!wapiModule) wapiModule = await import('@imjxsx/wapi');
    return wapiModule;
};

export class MessageHandler {
    dbService: any;
    gachaService: any;
    streamManager: any;
    queueManager: any;
    cacheManager: any;
    shopService: any;
    levelService: any;
    economySeason: any;
    PREFIX: string;
    rateLimitMap: Map<string, any>;
    processedMessages: Map<string, number>;

    constructor(dbService: any, gachaService: any, streamManager: any, queueManager: any, cacheManager: any, shopService: any, levelService: any, economySeasonService: any) {
        this.dbService = dbService;
        this.gachaService = gachaService;
        this.streamManager = streamManager;
        this.queueManager = queueManager;
        this.cacheManager = cacheManager;
        this.shopService = shopService;
        this.levelService = levelService;
        this.economySeason = economySeasonService;
        this.PREFIX = '#';
        this.rateLimitMap = new Map();
        this.processedMessages = new Map();
        setInterval(() => this.cleanup(), 30000);
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, data] of this.rateLimitMap) {
            if (now - data.lastCommand > RATE_LIMIT.SPAM_WINDOW) this.rateLimitMap.delete(userId);
        }
        for (const [msgId, timestamp] of this.processedMessages) {
            if (now - timestamp > 5000) this.processedMessages.delete(msgId);
        }
    }

    checkRateLimit(userId: string) {
        const now = Date.now();
        let userData = this.rateLimitMap.get(userId);
        if (!userData) {
            this.rateLimitMap.set(userId, { lastCommand: now, count: 1, timeout: null });
            return { limited: false };
        }
        if (userData.timeout && now < userData.timeout) return { limited: true, message: ERRORS.SPAM_DETECTED };
        else if (userData.timeout) {
            userData.timeout = null;
            userData.count = 0;
        }
        if (now - userData.lastCommand < RATE_LIMIT.COMMAND_COOLDOWN) {
            userData.count++;
            if (userData.count >= RATE_LIMIT.SPAM_THRESHOLD) {
                userData.timeout = now + RATE_LIMIT.SPAM_TIMEOUT;
                return { limited: true, message: ERRORS.SPAM_DETECTED };
            }
            return { limited: true, message: ERRORS.RATE_LIMITED };
        }
        if (now - userData.lastCommand > RATE_LIMIT.SPAM_WINDOW) userData.count = 1;
        else userData.count++;
        userData.lastCommand = now;
        return { limited: false };
    }

    isDuplicate(messageId: string) {
        if (this.processedMessages.has(messageId)) return true;
        this.processedMessages.set(messageId, Date.now());
        return false;
    }

    static PREMBOT_EXCLUSIVE_COMMANDS = ['setnamesubbot', 'setbiosubbot', 'setimagesubbot', 'configbot', 'miconfig', 'prembot', 'prembotadmin', 'padmin'];

    async handleMessage(bot: any, m: any, isPrembot = false, isSubbot = false) {
        if (!m.message) return;
        const messageType = Object.keys(m.message)[0];
        let text = '';
        if (messageType === 'conversation') text = m.message.conversation;
        else if (messageType === 'extendedTextMessage') text = m.message.extendedTextMessage?.text || '';
        else if (messageType === 'imageMessage') text = m.message.imageMessage?.caption || '';
        else if (messageType === 'videoMessage') text = m.message.videoMessage?.caption || '';

        try {
            const isSpecialBot = isPrembot || isSubbot;
            if (m.key.fromMe && !isSpecialBot) return;

            const messageId = m.key.id;
            if (this.isDuplicate(messageId)) return;
            const chatId = m.key.remoteJid;
            let sender = m.key.participant || m.key.remoteJid;
            const senderLid = sender;
            let senderPhone = null;

            if (m.key.participantAlt?.includes('@s.whatsapp.net')) senderPhone = m.key.participantAlt.split(':')[0].split('@')[0];
            else if (m.key.remoteJidAlt?.includes('@s.whatsapp.net')) senderPhone = m.key.remoteJidAlt.split(':')[0].split('@')[0];
            else if (m.senderAlt?.includes('@s.whatsapp.net')) senderPhone = m.senderAlt.split(':')[0].split('@')[0];
            else if (sender.includes('@s.whatsapp.net')) senderPhone = sender.split(':')[0].split('@')[0];
            else if (!chatId.endsWith('@g.us') && chatId.includes('@s.whatsapp.net')) senderPhone = chatId.split(':')[0].split('@')[0];
            else if (m.key.fromMe && bot.ws?.user?.id) senderPhone = bot.ws.user.id.split(':')[0].split('@')[0];

            if (sender.includes('@lid')) {
                const lidMatch = sender.match(/^(\d+)/);
                if (senderPhone) sender = `${senderPhone}@s.whatsapp.net`;
                else if (chatId.endsWith('@g.us') && lidMatch) {
                    try {
                        const groupMetadata = await bot.ws.groupMetadata(chatId);
                        const participant = groupMetadata.participants.find((p: any) => p.lid === sender || p.id === sender);
                        if (participant && participant.id && !participant.id.includes('@lid')) {
                            sender = participant.id;
                            senderPhone = sender.split('@')[0];
                        } else sender = `${lidMatch[1]}@s.whatsapp.net`;
                    } catch (err) {
                        logger.error('Error resolving LID from Group Metadata:', err);
                        sender = `${lidMatch[1]}@s.whatsapp.net`;
                    }
                } else if (lidMatch) sender = `${lidMatch[1]}@s.whatsapp.net`;
            }

            const isGroup = chatId.endsWith('@g.us');
            const isOwnerSender = isOwner(sender);

            const ctx: any = {
                bot: {
                    sendMessage: async (jid: string, content: any, options: any) => await bot.ws.sendMessage(jid, content, options),
                    sock: bot.ws,
                    groupMetadata: async (jid: string) => await bot.ws.groupMetadata(jid),
                    groupParticipantsUpdate: async (jid: string, participants: any[], action: any) => await bot.ws.groupParticipantsUpdate(jid, participants, action)
                },
                msg: m,
                sender: sender,
                senderLid: senderLid,
                senderPhone: senderPhone,
                chatId: chatId,
                isGroup: isGroup,
                body: text,
                text: text,
                args: [],
                isPrembot: isPrembot,
                isSubbot: isSubbot,
                isSpecialBot: isSpecialBot,
                isFromMe: m.key.fromMe,
                isOwner: isOwnerSender,
                userData: await this.dbService.getUser(sender, senderLid),
                dbService: this.dbService,
                gachaService: this.gachaService,
                streamManager: this.streamManager,
                queueManager: this.queueManager,
                cacheManager: this.cacheManager,
                shopService: this.shopService,
                levelService: this.levelService,
                economySeason: this.economySeason,
                tokenService: (global as any).tokenService,
                prembotManager: (global as any).prembotManager,
                from: { id: sender, jid: sender, name: m.pushName || 'Usuario' },
                reply: async (text: string, options: any = {}) => {
                    if (!bot.ws) return;
                    return await bot.ws.sendMessage(chatId, { text, ...options }, { quoted: m });
                },
                replyWithAudio: async (url: string, options: any = {}) => {
                    if (!bot.ws) return;
                    return await bot.ws.sendMessage(chatId, { audio: { url }, mimetype: 'audio/mpeg', ...options }, { quoted: m });
                },
                replyWithVideo: async (url: string, options: any = {}) => {
                    if (!bot.ws) return;
                    return await bot.ws.sendMessage(chatId, { video: { url }, ...options }, { quoted: m });
                },
                replyWithImage: async (url: string, options: any = {}) => {
                    if (!bot.ws) return;
                    return await bot.ws.sendMessage(chatId, { image: { url }, ...options }, { quoted: m });
                },
                download: async (message: any) => {
                    const wapi = await getWapi();
                    const { downloadContentFromMessage } = wapi;
                    const msg = message || m;
                    const type = Object.keys(msg.message)[0];
                    const stream = await downloadContentFromMessage(msg.message[type], type.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    return buffer;
                },
                prefix: this.PREFIX
            };

            const lastXp = this.cacheManager.get(`xp_${sender}`);
            if (!lastXp && text.length > 3) {
                const xpAmount = Math.floor(Math.random() * 6) + 5;
                this.levelService.addXp(sender, xpAmount).then((res: any) => {
                    if (res.leveledUp) ctx.reply(styleText(`🎉 *¡SUBISTE DE NIVEL!*\n\n> Nivel: *${res.currentLevel}*`));
                }).catch((e: any) => logger.error('XP Error:', e));
                this.cacheManager.set(`xp_${sender}`, true, 30);
            }

            if ((global as any).beforeHandlers?.length > 0) {
                const results = await Promise.allSettled((global as any).beforeHandlers.map(({ handler, plugin }: any) => handler(ctx).catch((err: any) => {
                    logger.error(`Error in before handler for ${plugin}:`, err);
                    throw err;
                })));
                results.forEach((result, idx) => {
                    if (result.status === 'rejected') logger.error(`Before handler ${(global as any).beforeHandlers[idx].plugin} failed`);
                });
            }

            const prefix = PREFIXES.find(p => text.startsWith(p));
            if (!text || !prefix) return;

            if (!isGroup && (global as any).db?.settings?.antiPrivado) {
                const isOwner = sender.split('@')[0] === (global as any).tokenService.OWNER_JID?.split('@')[0] || m.key.fromMe;
                if (!isOwner && !isSpecialBot) {
                    logger.info(`[AntiPrivado] Bloqueado mensaje de ${sender} en chat ${chatId}`);
                    return;
                }
            }

            const rateCheck = this.checkRateLimit(sender);
            if (rateCheck.limited) {
                logger.warn(`🔍 [MH] Rate Limit activado para ${sender}`);
                if (rateCheck.message === ERRORS.SPAM_DETECTED) {
                    const lastWarning = this.cacheManager.get(`spam_warn_${sender}`);
                    if (!lastWarning) {
                        await ctx.reply(styleText(rateCheck.message));
                        this.cacheManager.set(`spam_warn_${sender}`, true, 30);
                    }
                }
                return;
            }

            const args = text.slice(prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            ctx.args = args;
            ctx.command = commandName;

            if (!commandName) return;

            const commandData = (global as any).commandMap.get(commandName);
            if (!commandData) {
                const fkontak = { key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' }, message: { contactMessage: { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${sender.split('@')[0]}:${sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` } }, participant: '0@s.whatsapp.net' };
                await bot.ws.sendMessage(chatId, { text: styleText(`(ó﹏ò｡) Lo siento, el comando *${commandName}* no existe en mis comandos.`) }, { quoted: fkontak });
                return;
            }

            if (MessageHandler.PREMBOT_EXCLUSIVE_COMMANDS.includes(commandName)) {
                if (isSpecialBot && !m.key.fromMe) {
                    await ctx.reply(styleText('ꕢ Este comando solo puede ser usado por el dueño del bot.'));
                    return;
                }
            }

            if (isGroup) {
                const groupData = await this.dbService.getGroup(chatId);
                if (groupData?.primaryBot) {
                    let currentBotId = '';
                    if (bot.ws?.user?.id) currentBotId = bot.ws.user.id;
                    else if (bot.ws?.state?.creds?.me?.id) currentBotId = bot.ws.state.creds.me.id;
                    else if (bot.user?.id) currentBotId = bot.user.id;

                    if (currentBotId) {
                        currentBotId = currentBotId.split(':')[0].split('@')[0];
                        if (currentBotId !== groupData.primaryBot) {
                            const setPrimaryCommands = ['setprimary', 'setmain', 'botprincipal'];
                            if (!setPrimaryCommands.includes(commandName)) logger.info(`[MH] WARN: ID mismatch (${currentBotId} vs ${groupData.primaryBot}) but ALLOWING execution to fix bug.`);
                        }
                    } else logger.warn('[MH] No se pudo obtener ID del bot, ignorando check de PrimaryBot');
                }
            }

            await commandData.execute(ctx);

            if (!ctx.userData.stats) ctx.userData.stats = {};
            const newCommands = (ctx.userData.stats.commands || 0) + 1;
            ctx.userData.stats.commands = newCommands;

            const pushName = m.pushName || m.key.pushName || undefined;
            const updates: any = { 'stats.commands': newCommands };
            if (pushName && ctx.userData.name !== pushName) updates.name = pushName;

            await this.dbService.updateUser(sender, updates);

            if (this.levelService) {
                const xpAmount = Math.floor(Math.random() * 25) + 10;
                await this.levelService.addXp(sender, xpAmount);
            }
        } catch (error) {
            logger.error('ꕢ Error procesando mensaje:', error);
            const prefix = PREFIXES.find(p => text.startsWith(p));
            if (prefix && text.trim().length > prefix.length) {
                const chatId = m.key.remoteJid;
                try {
                    await bot.ws.sendMessage(chatId, { text: styleText(ERRORS.GENERIC_ERROR) }, { quoted: m });
                } catch { }
            }
        }
    }
}
