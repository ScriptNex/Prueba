import { styleText } from '../utils/helpers.js';
import { globalLogger as logger } from '../utils/Logger.js';
import { DatabaseService } from '../services/database/DatabaseService.js';

export class AlertHandler {
    dbService: DatabaseService;

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
    }

    async handle(bot: any, event: any) {
        const { id, participants, action, author } = event;
        if (!['promote', 'demote', 'remove'].includes(action)) return;
        const groupData = await this.dbService.getGroup(id);
        if (!groupData?.settings?.alerts) return;
        const maker = author;
        for (const participant of participants) {
            const participantId = typeof participant === 'string' ? participant : (participant.phoneNumber || participant.id);
            let message = '';
            const makerNumber = maker?.split('@')[0]?.split(':')[0];
            const participantNumber = participantId?.split('@')[0]?.split(':')[0];
            if (action === 'promote') message = `> ⌞✦⌝ *@${makerNumber || 'Desconocido'}* ha promovido a @${participantNumber || 'Desconocido'}`;
            else if (action === 'demote') message = `> ⌞✦⌝ *@${makerNumber || 'Desconocido'}* ha quitado el admin a @${participantNumber || 'Desconocido'}`;
            else if (action === 'remove') {
                if (makerNumber && participantNumber && makerNumber !== participantNumber) {
                    message = `> ⌞✦⌝ *@${makerNumber}* ha eliminado a *@${participantNumber}*`;
                }
            }
            if (message) {
                const mentions = [maker, participantId].filter(Boolean);
                try {
                    await bot.ws.sendMessage(id, { text: styleText(message), mentions: mentions });
                } catch (sendErr: any) {
                    logger.error(`[AlertHandler] Error enviando mensaje:`, sendErr.message);
                }
            }
        }
    }
}
