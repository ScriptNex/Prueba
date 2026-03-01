import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const command: Command = {
    commands: ['antirobo', 'proteger'],
    async execute(ctx: CommandContext) {
        const { args, userData, reply, dbService } = ctx;
        if (!args[0] || !['hora', 'dia', 'semana', 'mes'].includes(args[0].toLowerCase())) {
            return await reply(styleText(
                `✘ Uso incorrecto.\nFormato correcto:\n\n` +
                `*#antirobo hora*  (5,000 monedas - 1 hora)\n` +
                `*#antirobo dia*   (25,000 monedas - 1 día)\n` +
                `*#antirobo semana* (100,000 monedas - 1 semana)\n` +
                `*#antirobo mes*   (300,000 monedas - 1 mes)`
            ));
        }

        const tipo = args[0].toLowerCase();
        let costo = 0;
        let duracion = 0;

        switch (tipo) {
            case 'hora':
                costo = 5000;
                duracion = 60 * 60 * 1000;
                break;
            case 'dia':
                costo = 25000;
                duracion = 24 * 60 * 60 * 1000;
                break;
            case 'semana':
                costo = 100000;
                duracion = 7 * 24 * 60 * 60 * 1000;
                break;
            case 'mes':
                costo = 300000;
                duracion = 30 * 24 * 60 * 60 * 1000;
                break;
        }

        // Use economy.coins if that's the standard, but the code says "monedas"
        // I'll check if userData has monedas or economy.coins. 
        // Based on previous economy commands, it was economy.coins.
        // But this gacha system seems to use its own fields? 
        // Let's stick to what the original code used but check mapping.
        const coins = userData.economy?.coins || userData.monedas || 0;

        if (coins < costo) {
            return await reply(styleText(
                `✘ No tienes suficientes monedas.\n` +
                `Necesitas *${costo.toLocaleString()}* monedas para activar el AntiRobo por ${tipo}.`
            ));
        }

        const newCoins = coins - costo;
        const antiroboTime = Date.now() + duracion;

        await dbService.updateUser(ctx.sender, { 
            'economy.coins': newCoins,
            'antirobo': antiroboTime 
        });

        await reply(styleText(
            `✅ *AntiRobo activado* por *${tipo}*.\n` +
            `🛡 Tus waifus estarán protegidas hasta:\n` +
            `*${new Date(antiroboTime).toLocaleString()}*`
        ));
    }
};

export default command;
