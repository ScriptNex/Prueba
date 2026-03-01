import { formatNumber, getCooldown, formatTime, getRandom, styleText, getCurrencyName } from '../../utils/helpers.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { Command, CommandContext } from '../../types/Command.js';

const SLUT_JOBS = [
    'te fuiste con un viejo millonario y tuviste sexo anal',
    'hiciste un baile exotico en una discoteca',
    'te paraste en la esquina y un joven te llevo a la sala',
    'fuiste dama de compañía de un negro',
    'hiciste streaming en Poringa',
    'vendiste fotos de tus pies',
    'trabajaste en un club nocturno y hiciste un trio',
    'ofreciste servicios especiales en pornhub',
    'estabas en el gimnasio y alguien tomo una foto de tu culo y lo vendio',
    'hiciste un video con un dildo de 8 pies',
    'creaste una pagina patra adultos',
    'te contrato BangBros para hacer una pelicula',
    'saliste con tu sugar daddy',
    'hiciste masajes con final feliz',
    'hiciste un video casero',
    'te vestiste de maid y te cojieron',
    'te contrataron para una despedida de soltero',
    'hiciste cosplay de miku',
    'te contrataron par hacer la voz de un personaje de anime h',
    'hiciste un video exclusivo en xnxx'
];

const command: Command = {
    commands: ['slut', 'prostitute'],
    tags: ['economy'],
    help: ['slut'],
    async execute(ctx: CommandContext) {
        try {
            if (ctx.isGroup) {
                const groupData = await ctx.dbService.getGroup(ctx.chatId);
                if (!groupData?.settings?.economy) {
                    return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
                }
            }

            const currencyName = await getCurrencyName(ctx);
            const userData = await ctx.dbService.getUser(ctx.sender);
            
            const lastSlut = userData?.economy?.lastSlut || 0;
            const COOLDOWN = 10 * 60 * 1000;
            const cooldown = getCooldown(lastSlut, COOLDOWN);

            if (cooldown > 0) {
                return await ctx.reply(styleText(
                    `ꕢ Calmate, necesitas un reposo\n> Vuelve en » ${formatTime(cooldown)}`
                ));
            }

            const REWARD = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
            const currentCoins = userData?.economy?.coins || 0;

            await ctx.dbService.updateUser(ctx.sender, {
                'economy.lastSlut': Date.now(),
                'economy.coins': currentCoins + REWARD
            });

            const job = getRandom(SLUT_JOBS);

            await ctx.reply(styleText(
                `ꕣ ${job} y ganaste *¥${formatNumber(REWARD)}* ${currencyName}.`
            ));

        } catch (error) {
            logger.error('[SLUT] ERROR:', error);
            await ctx.reply(styleText('ꕢ Error al ejecutar el comando.'));
        }
    }
};

export default command;
