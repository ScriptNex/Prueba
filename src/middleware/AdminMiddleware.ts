import { globalLogger as logger } from '../utils/Logger.js';

export class AdminMiddleware {
    static async handle(ctx: any, next: () => Promise<void>) {
        if (!ctx.isOwner) {
            return ctx.reply('ꕢ Este comando solo puede ser usado por el administrador.');
        }
        return next();
    }
}
