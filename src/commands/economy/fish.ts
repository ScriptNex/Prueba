import { formatNumber, getCooldown, formatTime, getRandom, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface Catch {
    name: string;
    emoji: string;
    baseValue: number;
}

interface Modifier {
    prefix: string;
    emoji: string;
    mul: number;
}

interface Junk {
    item: string;
    emoji: string;
    value: number;
}

const BASE_CATCHES: Record<string, Catch[]> = {
    common: [
        { name: 'Trucha', emoji: '🐟', baseValue: 100 }, { name: 'Sardina', emoji: '🐟', baseValue: 50 }, { name: 'Arenque', emoji: '🐟', baseValue: 60 },
        { name: 'Boquerón', emoji: '🐟', baseValue: 55 }, { name: 'Carpa', emoji: '🐟', baseValue: 90 }, { name: 'Bagre', emoji: '🐟', baseValue: 110 },
        { name: 'Tilapia', emoji: '🐟', baseValue: 120 }, { name: 'Perca', emoji: '🐟', baseValue: 95 }, { name: 'Mojarra', emoji: '🐟', baseValue: 85 },
        { name: 'Pez Gato', emoji: '🐟', baseValue: 105 }, { name: 'Renacuajo', emoji: '🐸', baseValue: 20 }, { name: 'Cangrejo', emoji: '🦀', baseValue: 80 },
        { name: 'Camarón', emoji: '🦐', baseValue: 70 }, { name: 'Anchoa', emoji: '🐟', baseValue: 45 }, { name: 'Jurel', emoji: '🐟', baseValue: 80 },
        { name: 'Lisa', emoji: '🐟', baseValue: 75 }, { name: 'Robalo', emoji: '🐟', baseValue: 130 }, { name: 'Caballa', emoji: '🐟', baseValue: 85 },
        { name: 'Pez Sol', emoji: '🐟', baseValue: 65 }, { name: 'Barbo', emoji: '🐟', baseValue: 90 }, { name: 'Gobio', emoji: '🐟', baseValue: 40 },
        { name: 'Carpín', emoji: '🐟', baseValue: 50 }, { name: 'Almeja', emoji: '🐚', baseValue: 30 }, { name: 'Mejillón', emoji: '🦪', baseValue: 35 },
        { name: 'Berberecho', emoji: '🐚', baseValue: 28 }, { name: 'Navaja', emoji: '🐚', baseValue: 32 }, { name: 'Guppy', emoji: '🐟', baseValue: 15 },
        { name: 'Tetra', emoji: '🐟', baseValue: 20 }, { name: 'Colis', emoji: '🐟', baseValue: 55 }, { name: 'Cíclido', emoji: '🐟', baseValue: 60 },
        { name: 'Betta', emoji: '🐟', baseValue: 70 }, { name: 'Molly', emoji: '🐟', baseValue: 25 }, { name: 'Platy', emoji: '🐟', baseValue: 30 },
        { name: 'Xipho', emoji: '🐟', baseValue: 35 }
    ],
    uncommon: [
        { name: 'Pez Dorado', emoji: '🐠', baseValue: 200 }, { name: 'Pez Payaso', emoji: '🐠', baseValue: 250 }, { name: 'Pez Globo', emoji: '🐡', baseValue: 350 },
        { name: 'Atún', emoji: '🐟', baseValue: 300 }, { name: 'Salmón', emoji: '🐟', baseValue: 400 }, { name: 'Bacalao', emoji: '🐟', baseValue: 380 },
        { name: 'Lenguado', emoji: '🐟', baseValue: 360 }, { name: 'Pez Volador', emoji: '🐟', baseValue: 450 }, { name: 'Anguila', emoji: '🐍', baseValue: 420 },
        { name: 'Langosta', emoji: '🦞', baseValue: 500 }, { name: 'Calamar', emoji: '🦑', baseValue: 480 }, { name: 'Pulpo', emoji: '🐙', baseValue: 490 },
        { name: 'Piraña', emoji: '🐟', baseValue: 400 }, { name: 'Lubina', emoji: '🐟', baseValue: 350 }, { name: 'Dorada', emoji: '🐟', baseValue: 320 },
        { name: 'Rodaballo', emoji: '🐟', baseValue: 450 }, { name: 'Rape', emoji: '🐟', baseValue: 480 }, { name: 'Merluza', emoji: '🐟', baseValue: 300 },
        { name: 'Sepia', emoji: '🦑', baseValue: 460 }, { name: 'Cangrejo Real', emoji: '🦀', baseValue: 550 }, { name: 'Estrella de Mar', emoji: '⭐', baseValue: 250 },
        { name: 'Erizo de Mar', emoji: '🦔', baseValue: 280 }, { name: 'Morena', emoji: '🐍', baseValue: 410 }, { name: 'Pez León', emoji: '🦁', baseValue: 440 },
        { name: 'Pez Piedra', emoji: '🪨', baseValue: 470 }, { name: 'Pez Cirujano', emoji: '🐠', baseValue: 310 }, { name: 'Pez Mariposa', emoji: '🐠', baseValue: 290 },
        { name: 'Pez Ángel', emoji: '🐠', baseValue: 340 }
    ],
    rare: [
        { name: 'Tiburón Bebé', emoji: '🦈', baseValue: 800 }, { name: 'Pez Espada', emoji: '🗡️', baseValue: 700 }, { name: 'Manta Raya', emoji: '🐙', baseValue: 600 },
        { name: 'Barracuda', emoji: '🐟', baseValue: 750 }, { name: 'Pez Vela', emoji: '🐟', baseValue: 850 }, { name: 'Medusa', emoji: '🪼', baseValue: 550 },
        { name: 'Caballito de Mar', emoji: '🐴', baseValue: 650 }, { name: 'Pez Ángel Reina', emoji: '👑', baseValue: 780 }, { name: 'Tortuga Marina', emoji: '🐢', baseValue: 900 },
        { name: 'Pez Remo', emoji: '📏', baseValue: 950 }, { name: 'Marlin', emoji: '🐟', baseValue: 920 }, { name: 'Atún Aleta Amarilla', emoji: '🐟', baseValue: 880 },
        { name: 'Mero', emoji: '🐟', baseValue: 980 }, { name: 'Tiburón Mako', emoji: '🦈', baseValue: 890 }, { name: 'Pez Sierra', emoji: '🪚', baseValue: 820 },
        { name: 'Narval Bebé', emoji: '🦄', baseValue: 960 }, { name: 'Esturión', emoji: '🐟', baseValue: 840 }, { name: 'Arapaima', emoji: '🐟', baseValue: 870 },
        { name: 'Pez Gato Gigante', emoji: '🐱', baseValue: 860 }, { name: 'Anguila Eléctrica', emoji: '⚡', baseValue: 790 }, { name: 'Pez Abisal', emoji: '🏮', baseValue: 990 },
        { name: 'Calamar Vampiro', emoji: '🧛', baseValue: 940 }, { name: 'Nautilus', emoji: '🐚', baseValue: 910 }, { name: 'Axolote', emoji: '🦎', baseValue: 800 }
    ],
    epic: [
        { name: 'Tiburón Martillo', emoji: '🔨', baseValue: 1500 }, { name: 'Tiburón Blanco', emoji: '🦈', baseValue: 2000 }, { name: 'Orca', emoji: '🐋', baseValue: 2500 },
        { name: 'Ballena Azul', emoji: '🐋', baseValue: 3000 }, { name: 'Narval', emoji: '🦄', baseValue: 2200 }, { name: 'Pez Luna', emoji: '🌑', baseValue: 1800 },
        { name: 'Megalodón (Diente)', emoji: '🦷', baseValue: 2800 }, { name: 'Cachalote', emoji: '🐋', baseValue: 2600 },
        { name: 'Beluga', emoji: '🐋', baseValue: 2400 }, { name: 'Manatí', emoji: '🐄', baseValue: 1900 }, { name: 'Delfín Rosado', emoji: '🐬', baseValue: 2100 },
        { name: 'Calamar Colosal', emoji: '🦑', baseValue: 2900 }, { name: 'Tiburón Ballena', emoji: '🐋', baseValue: 2700 }, { name: 'Pez Dragón Negro', emoji: '🐉', baseValue: 2300 },
        { name: 'Tiburón Duende', emoji: '👺', baseValue: 2500 }, { name: 'Tiburón Tigre', emoji: '🐯', baseValue: 1700 }, { name: 'Tiburón Toro', emoji: '🐂', baseValue: 1600 }
    ],
    legendary: [
        { name: 'Pez Legendario', emoji: '✨', baseValue: 5000 }, { name: 'Tesoro Hundido', emoji: '💎', baseValue: 7000 }, { name: 'Tentáculo de Kraken', emoji: '🦑', baseValue: 8000 },
        { name: 'Leviatán', emoji: '🐉', baseValue: 10000 }, { name: 'Perla Negra', emoji: '⚫', baseValue: 6000 }, { name: 'Tridente de Poseidón', emoji: '🔱', baseValue: 15000 },
        { name: 'Cofre de Oro', emoji: '💰', baseValue: 5500 }, { name: 'Corona del Rey', emoji: '👑', baseValue: 9000 }, { name: 'Mapa del Tesoro', emoji: '🗺️', baseValue: 5200 },
        { name: 'Ancla de Oro', emoji: '⚓', baseValue: 6500 }, { name: 'Escama de Dragón', emoji: '🐲', baseValue: 7500 }, { name: 'Huevo de Fabergé', emoji: '🥚', baseValue: 8500 },
        { name: 'Rubí del Océano', emoji: '♦️', baseValue: 6200 }, { name: 'Zafiro Profundo', emoji: '💎', baseValue: 6300 }, { name: 'Esmeralda Atlante', emoji: '📗', baseValue: 6400 },
        { name: 'Fósil Viviente', emoji: '🦴', baseValue: 5800 }, { name: 'Perla Gigante', emoji: '⚪', baseValue: 5300 }, { name: 'Estatua de Oro', emoji: '🗿', baseValue: 6800 },
        { name: 'Cáliz Sagrado', emoji: '🏆', baseValue: 7200 }
    ],
    mythic: [
        { name: 'Sirena (Real)', emoji: '🧜‍♀️', baseValue: 25000 }, { name: 'Cthulhu', emoji: '🐙', baseValue: 50000 }, { name: 'Nessie', emoji: '🦕', baseValue: 40000 },
        { name: 'Godzilla Marino', emoji: '🦖', baseValue: 45000 }, { name: 'Moby Dick', emoji: '🐋', baseValue: 35000 }, { name: 'Hydra', emoji: '🐍', baseValue: 42000 },
        { name: 'Jormungandr', emoji: '🐍', baseValue: 48000 }, { name: 'Scylla', emoji: '👺', baseValue: 38000 }, { name: 'Charybdis', emoji: '🌀', baseValue: 39000 },
        { name: 'Atlantis', emoji: '🏙️', baseValue: 60000 }, { name: 'Holandés Errante', emoji: '👻', baseValue: 30000 }, { name: 'Excalibur', emoji: '⚔️', baseValue: 32000 },
        { name: 'Bickini Bottom', emoji: '🍍', baseValue: 100000 }, { name: 'Barco Fantasma', emoji: '🚢', baseValue: 28000 }, { name: 'Isla Flotante', emoji: '🏝️', baseValue: 55000 }
    ]
};

const MODIFIERS: Modifier[] = [
    { prefix: 'Mutante', emoji: '☣️', mul: 1.5 }, { prefix: 'Radioactivo', emoji: '☢️', mul: 2.0 },
    { prefix: 'Espacial', emoji: '🌌', mul: 2.5 }, { prefix: 'Fantasma', emoji: '👻', mul: 1.8 },
    { prefix: 'Robótico', emoji: '🤖', mul: 1.6 }, { prefix: 'Dorado', emoji: '💰', mul: 3.0 },
    { prefix: 'Arcoíris', emoji: '🌈', mul: 2.2 }, { prefix: 'De Fuego', emoji: '🔥', mul: 1.7 },
    { prefix: 'Congelado', emoji: '❄️', mul: 1.7 }, { prefix: 'Eléctrico', emoji: '⚡', mul: 1.9 },
    { prefix: 'Oscuro', emoji: '🌑', mul: 2.1 }, { prefix: 'Sagrado', emoji: '✨', mul: 2.3 },
    { prefix: 'Antiguo', emoji: '📜', mul: 1.4 }, { prefix: 'Gigante', emoji: '🐘', mul: 1.3 },
    { prefix: 'Diminuto', emoji: '🐜', mul: 0.8 }, { prefix: 'Zombie', emoji: '🧟', mul: 1.5 },
    { prefix: 'Alien', emoji: '👽', mul: 2.4 }, { prefix: 'De Neón', emoji: '💡', mul: 1.6 },
    { prefix: 'Invisible', emoji: '🫥', mul: 2.0 }, { prefix: 'Cibernético', emoji: '🦾', mul: 1.9 },
    { prefix: 'Prehistórico', emoji: '🦖', mul: 1.8 }, { prefix: 'Mágico', emoji: '🪄', mul: 2.0 },
    { prefix: 'Maldito', emoji: '💀', mul: 0.5 }, { prefix: 'Kawaii', emoji: '🌸', mul: 1.5 },
    { prefix: 'Supremo', emoji: '👑', mul: 5.0 }, { prefix: 'Glitch', emoji: '👾', mul: 4.0 },
    { prefix: 'De Cristal', emoji: '💎', mul: 2.8 }, { prefix: 'Tóxico', emoji: '☠️', mul: 1.2 },
    { prefix: 'Volador', emoji: '🕊️', mul: 1.4 }, { prefix: 'Bíblico', emoji: '✝️', mul: 3.5 }
];

const JUNK: Junk[] = [
    { item: 'Bota vieja', emoji: '👢', value: 10 }, { item: 'Lata oxidada', emoji: '🥫', value: 5 },
    { item: 'Neumático', emoji: '⭕', value: 15 }, { item: 'Alga marina', emoji: '🌿', value: 2 },
    { item: 'Botella de plástico', emoji: '🍾', value: 3 }, { item: 'Nada (se escapó)', emoji: '💨', value: 0 },
    { item: 'Calcetín mojado', emoji: '🧦', value: 1 }, { item: 'Espina de pescado', emoji: '🦴', value: 0 },
    { item: 'Anzuelo oxidado', emoji: '🪝', value: 5 }, { item: 'Bolsa de basura', emoji: '🗑️', value: 0 },
    { item: 'Tronco podrido', emoji: '🪵', value: 8 }, { item: 'Piedra', emoji: '🪨', value: 0 },
    { item: 'Cáscara de plátano', emoji: '🍌', value: 1 }, { item: 'Cubo con agujero', emoji: '🪣', value: 2 },
    { item: 'Red rota', emoji: '🕸️', value: 4 }, { item: 'Zapato sin par', emoji: '👞', value: 9 },
    { item: 'Gafas de sol rotas', emoji: '🕶️', value: 6 }, { item: 'Periódico mojado', emoji: '📰', value: 1 },
    { item: 'Rueda de bicicleta', emoji: '🚲', value: 12 }, { item: 'Caja de pizza vacía', emoji: '🍕', value: 2 },
    { item: 'Juguete roto', emoji: '🧸', value: 5 }, { item: 'Tenedor de plástico', emoji: '🍴', value: 1 },
    { item: 'Cepillo de dientes usado', emoji: '🪥', value: 1 }, { item: 'Espejo roto', emoji: '🪞', value: 3 },
    { item: 'Sombrero viejo', emoji: '👒', value: 7 }, { item: 'Paraguas roto', emoji: '☂️', value: 8 },
    { item: 'Silla de playa rota', emoji: '🪑', value: 11 }, { item: 'Balón pinchado', emoji: '⚽', value: 4 },
    { item: 'Boya desinflada', emoji: '🎈', value: 5 }, { item: 'Aleta perdida', emoji: '🤿', value: 10 },
    { item: 'Diente de leche', emoji: '🦷', value: 1 }, { item: 'CD rayado', emoji: '💿', value: 2 },
    { item: 'Pila gastada', emoji: '🔋', value: 0 }, { item: 'Tapa de inodoro', emoji: '🚽', value: 15 },
    { item: 'Sartén oxidada', emoji: '🍳', value: 6 }, { item: 'Trapo sucio', emoji: '🧺', value: 1 },
    { item: 'Esqueleto de pez', emoji: '☠️', value: 0 }, { item: 'Cuerda enredada', emoji: '➰', value: 3 },
    { item: 'Cartel de "No Pescar"', emoji: '🚷', value: 20 }, { item: 'Peluca mojada', emoji: '💇‍♀️', value: 8 }
];

const RARITY_COLORS: Record<string, string> = {
    'común': '⚪',
    'poco común': '🟢',
    'raro': '🔵',
    'épico': '🟣',
    'legendario': '🟡',
    'mítico': '🔴'
};

const command: Command = {
    commands: ['fish', 'pescar', 'fishing', 'pesca'],
    tags: ['economy'],
    help: ['fish'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }

        const userData = await ctx.dbService.getUser(ctx.sender);
        const lastFish = userData.economy?.lastFish || 0;
        const fishCaught = userData.economy?.fishCaught || 0;
        const coins = userData.economy?.coins || 0;
        const currencyName = await getCurrencyName(ctx);

        const COOLDOWN = 30 * 1000;
        const cooldown = getCooldown(lastFish, COOLDOWN);

        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `🎣 El pez necesita tiempo para morder.\n> Vuelve en » ${formatTime(cooldown)}`
            ));
        }

        await ctx.dbService.updateUser(ctx.sender, { 'economy.lastFish': Date.now() });
        const roll = Math.random() * 100;

        if (roll < 20) {
            const caught = getRandom(JUNK);
            await ctx.reply(styleText(
                `🎣 *Pescaste...*\n\n` +
                `${caught.emoji} ${caught.item}\n` +
                `💰 Valor » ¥${formatNumber(caught.value)} ${currencyName}\n\n` +
                `> Mejor suerte la próxima vez`
            ));
            return;
        }

        let rarity: string;
        if (roll < 50) rarity = 'common';
        else if (roll < 75) rarity = 'uncommon';
        else if (roll < 90) rarity = 'rare';
        else if (roll < 98) rarity = 'epic';
        else if (roll < 99.8) rarity = 'legendary';
        else rarity = 'mythic';

        const baseFish = getRandom(BASE_CATCHES[rarity]);
        const modifierRoll = Math.random();
        let modifier: Modifier | null = null;
        if (modifierRoll < 0.30) {
            modifier = getRandom(MODIFIERS);
        }

        const itemName = modifier ? `${modifier.prefix} ${baseFish.name}` : baseFish.name;
        const itemEmoji = modifier ? `${modifier.emoji}${baseFish.emoji}` : baseFish.emoji;
        let value = baseFish.baseValue;
        if (modifier) {
            value = Math.floor(value * modifier.mul);
        }

        await ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': coins + value,
            'economy.fishCaught': fishCaught + 1
        });

        const rarityDisplayMap: Record<string, string> = {
            'common': 'Común',
            'uncommon': 'Poco Común',
            'rare': 'Raro',
            'epic': 'Épico',
            'legendary': 'Legendario',
            'mythic': 'Mítico'
        };

        const rarityDisplay = rarityDisplayMap[rarity];
        const rarityColor = RARITY_COLORS[rarityDisplay.toLowerCase()] || '⚪';
        const newFishCount = fishCaught + 1;
        const newBalance = coins + value;

        await ctx.reply(styleText(
            `🎣 *¡ATRAPASTE ALGO!*\n\n` +
            `${itemEmoji} *${itemName}*\n` +
            `${rarityColor} Rareza: ${rarityDisplay}\n` +
            `💰 Valor: ¥${formatNumber(value)} ${currencyName}\n\n` +
            `🐟 Peces atrapados: ${newFishCount}\n` +
            `💰 Balance: ¥${formatNumber(newBalance)} ${currencyName}`
        ));
    }
};

export default command;
