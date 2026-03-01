import { Command, CommandContext } from '../types/Command.js';

function getGreeting(phoneNumber: string) {
    // Mapa de códigos de país a offset UTC
    const timezoneMap: { [key: string]: number } = {
        // América
        '1': -5,        // USA/Canadá (EST)
        '52': -6,       // México
        '51': -5,       // Perú
        '54': -3,       // Argentina
        '55': -3,       // Brasil
        '56': -4,       // Chile
        '57': -5,       // Colombia
        '58': -4,       // Venezuela
        '591': -4,      // Bolivia
        '593': -5,      // Ecuador
        '595': -4,      // Paraguay
        '598': -3,      // Uruguay
        '506': -6,      // Costa Rica
        '507': -5,      // Panamá
        '502': -6,      // Guatemala
        '503': -6,      // El Salvador
        '504': -6,      // Honduras
        '505': -6,      // Nicaragua
        '509': -5,      // Haití
        '53': -5,       // Cuba
        // Europa
        '34': 1,        // España
        '33': 1,        // Francia
        '39': 1,        // Italia
        '49': 1,        // Alemania
        '44': 0,        // Reino Unido
        '351': 0,       // Portugal
        // Asia
        '81': 9,        // Japón
        '82': 9,        // Corea del Sur
        '86': 8,        // China
        '91': 5.5,      // India
        '62': 7,        // Indonesia
        '63': 8,        // Filipinas
        '66': 7,        // Tailandia
        '84': 7,        // Vietnam
    };

    let utcOffset = 0;
    const code3 = phoneNumber.substring(0, 3);
    const code2 = phoneNumber.substring(0, 2);
    const code1 = phoneNumber.substring(0, 1);

    if (timezoneMap[code3] !== undefined) {
        utcOffset = timezoneMap[code3];
    } else if (timezoneMap[code2] !== undefined) {
        utcOffset = timezoneMap[code2];
    } else if (timezoneMap[code1] !== undefined) {
        utcOffset = timezoneMap[code1];
    }

    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();

    let totalMinutes = (utcHours * 60) + utcMinutes + (utcOffset * 60);
    totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

    const localHours = Math.floor(totalMinutes / 60);

    if (localHours >= 6 && localHours < 12) {
        return '𝐁𝐮𝐞𝐧𝐨𝐬 𝐃𝐢𝐚𝐬';
    } else if (localHours >= 12 && localHours < 20) {
        return '𝐁𝐮𝐞𝐧𝐚𝐬 𝐓𝐚𝐫𝐝𝐞𝐬';
    } else {
        return '𝐁𝐮𝐞𝐧𝐚𝐬 𝐍𝐨𝐜𝐡𝐞𝐬';
    }
}

const command: Command = {
    commands: ['help', 'menu'],
    async execute(ctx: CommandContext) {
        let helpText = '';
        try {
            const { bot, sender, reply, chatId, args, dbService, tokenService } = ctx;
            const senderNumber = sender.split('@')[0];
            const username = ctx.from?.name || senderNumber;
            
            const botId = bot?.sock.user?.id?.split(':')[0] || bot?.sock.user?.id;
            const userId = botId ? `${botId}@s.whatsapp.net` : sender;
            const prembotConfig = (tokenService as any)?.getPrembotConfig?.(userId);
            const botName = prembotConfig?.customName || 'Alya Kujou';

            const greeting = getGreeting(senderNumber);

            let menuImage = 'https://2371phzjsd.ucarecd.net/da3a96be-f177-44c4-a690-d97811d2ee34/468a4c1811674263ad7582010215564a.jpg';
            if (prembotConfig?.customImage) {
                menuImage = prembotConfig.customImage;
            }
            
            const userCount = (await dbService?.getUserCount?.()) || 0;
            const section = args[0]?.toLowerCase();
            
            const sectionMap: { [key: string]: string } = {
                'economia': 'economy',
                'economy': 'economy',
                'gacha': 'gacha',
                'descargas': 'downloads',
                'downloads': 'downloads',
                'buscadores': 'search',
                'search': 'search',
                'utilidades': 'utilities',
                'utilities': 'utilities',
                'utils': 'utilities',
                'diversion': 'fun',
                'diversión': 'fun',
                'fun': 'fun',
                'juegos': 'games',
                'games': 'games',
                'subbot': 'subbot',
                'nsfw': 'nsfw',
                'admin': 'admin',
                'administracion': 'admin',
                'administración': 'admin'
            };
            
            const requestedSection = sectionMap[section];
            
            const sections: { [key: string]: string } = {
                header: `${greeting} *${username}*, 𝐬𝐨𝐲 *${botName}* 𝐲 𝐩𝐞𝐫𝐨 𝐩𝐚𝐬𝐚𝐫𝐦𝐞𝐥𝐚 𝐦𝐮𝐲 𝐛𝐢𝐞𝐧 𝐜𝐨𝐧𝐭𝐢𝐠𝐨 (˶ᵔ ᵕ ᵔ˶)
╭─────── ୨୧ ───────╮
│ ♡ Canal    › https://whatsapp.com/channel/0029VbByI3uL7UVYZD00xF2B
│ ✮ Usuarios › *${userCount}*
│ 𖣂 v3.8     › Usuario: ${username}
╰────────────────╯`,
                economy: `*╭─⊹ Economía⊹ ࣪ ˖ 𐔌՞. .՞𐦯──╮*
> ✎ \`𝐆𝐚𝐧𝐚 𝐦𝐨𝐧𝐞𝐝𝐚𝐬, 𝐚𝐩𝐮𝐞𝐬𝐭𝐚 𝐲 𝐣𝐮𝐞́𝐠𝐚𝐭𝐞𝐥𝐚\`
✦ *::* *#economy* \`<on/off>\`
> » Desactiva o activa el sistema de economía.
✦ *::* *#balance* • *#bal*
> » Ver tus coins.
✦ *::* *#coinflip* • *#cf* \`<cantidad>\` \`<cara/cruz>\`
> » Apuesta cara o cruz.
✦ *::* *#crime*
> » Haz un robo y gana dinero.
✦ *::* *#daily*
> » Reclama tu recompensa diaria.
✦ *::* *#deposit* • *#d* \`<cantidad>\`
> » Guarda tus coins.
✦ *::* *#economyboard* • *#baltop*
> » Mira el top de usuarios con más monedas.
✦ *::* *#givecoins* • *#pay* \`<@user>\`
> » Regala coins a un usuario.
✦ *::* *#roulette* • *#rt* \`<red/black>\` \`<cantidad>\`
> » Gira la ruleta y gana coins.
✦ *::* *#slut*
> » Trabaja dudosamente para ganar coins.
✦ *::* *#steal* \`<@user>\`
> » Roba coins a un usuario.
✦ *::* *#slot* \`<cantidad>\`
> » Apuesta en la tragaperras (x5 Jackpot).
✦ *::* *#withdraw* • *#wd* \`<cantidad|all>\`
> » Retira una cantidad de coins.
✦ *::* *#work* • *#w*
> » Trabaja y gana coins.
✦ *::* *#beg* • *#pedir*
> » Pide dinero en la calle.
✦ *::* *#fish* • *#pescar*
> » Pesca y gana coins (sistema de rarezas).
✦ *::* *#einfo* \`<@user>\`
> » Mira las estadísticas de economía de alguien.
✦ *::* *#season*
> » Mira la temporada actual del pase de batalla.
✦ *::* *#shop* • *#tienda* \`<pag>\`
> » Abre la tienda de Soblend.
✦ *::* *#buy* • *#comprar* \`<id> <ant>\`
> » Compra objetos de la tienda.
✦ *::* *#inventory* • *#inv*
> » Mira tus objetos comprados.
✦ *::* *#use* • *#usar* \`<id>\`
> » Usa un objeto de tu inventario.
✦ *::* *#level* • *#rank*
> » Mira tu nivel y XP actual.
✦ *::* *#blackjack* • *#bj* \`<apuesta>\`
> » Juega al 21 contra la casa.
*╰────────────────╯*`,
                gacha: `*╭─⊹ Gacha⊹ ࣪ ˖ (˶˃ ᵕ ˂˶)──╮*
> ✎ \`𝐂𝐨𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐚 𝐰𝐚𝐢𝐟𝐮𝐬 𝐞 𝐢𝐧𝐭𝐞𝐫𝐜𝐚́𝐦𝐛𝐢𝐚𝐥𝐨𝐬\`
✦ *::* *#claim* • *#c*
> » Reclama una waifu aleatoria.
✦ *::* *#harem* • *#miswaifu*
> » Mira las waifus que tienes.
✦ *::* *#rollwaifu* • *#rw*
> » Mira una waifu aleatoria.
✦ *::* *#give* • *#regalar* \`<id>\` \`<@user>\`
> » Regala una waifu a alguien.
✦ *::* *#sell* • *#vender* \`<id>\`
> » Vende un personaje.
✦ *::* *#antirobo* • *#proteger* \`<hora/dia/semana/mes>\`
> » Protege tus waifus de robos.
✦ *::* *#dar* \`<@user>\` \`<id>\`
> » Da un personaje a otro usuario.
✦ *::* *#desbloquear* • *#unlock* \`<@user>\`
> » Desbloquea la base de un usuario.
✦ *::* *#listawaifus* • *#listwaifus* \`<página>\`
> » Muestra la lista completa de personajes.
✦ *::* *#robarwaifu* • *#robar* \`<id>\`
> » Roba un personaje de otro usuario.
✦ *::* *#resetwaifus*
> » Reinicia todas las waifus (solo owner).
✦ *::* *#delwaifu* \`<id>\`
> » Elimina una waifu de tu colección.
✦ *::* *#vote*
> » Vota por tu waifu favorita.
✦ *::* *#wimage* \`<nombre>\`
> » Busca una imagen de un personaje.
✦ *::* *#winfo* \`<nombre>\`
> » Mira la información de un personaje.
✦ *::* *#wvideo* \`<nombre>\`
> » Mira un video de un personaje.
✦ *::* *#ainfo* \`<anime>\`
> » Ver todos los personajes de un anime específico.
✦ *::* *#wtop*
> » Mira el top de waifus más populares.
✦ *::* *#trade* • *#intercambio* \`<tu_personaje>\` \`<su_personaje>\` \`<@user>\`
> » Intercambia personajes con otro usuario.
✦ *::* *#wcow*
> » Mira la información de tus waifus.
*╰────────────────╯*`,
                downloads: `*╭─⊹ Descargas⊹ ࣪ ˖ 𐔌՞. .՞𐦯──╮*
> ✎ \`𝐃𝐞𝐬𝐜𝐚𝐫𝐠𝐚 𝐜𝐨𝐧𝐭𝐞𝐧𝐢𝐝𝐨 𝐝𝐞 𝐩𝐥𝐚𝐭𝐚𝐟𝐨𝐫𝐦𝐚𝐬\`
✦ *::* *#ig* \`<link>\`
> » Descarga un video de Instagram.
✦ *::* *#tiktok* \`<link>\`
> » Descarga un video de TikTok.
✦ *::* *#mediafire* • *#mf* \`<link>\`
> » Descarga un archivo de Mediafire.
✦ *::* *#youtube* \`<link>\`
> » Descarga un mp3 o mp4 de YouTube.
✦ *::* *#play* \`<query/url>\`
> » Descarga música o video de YouTube.
✦ *::* *#ytmp3* \`<link>\`
> » Descarga audio de YouTube.
✦ *::* *#ytmp4* \`<link>\`
> » Descarga video de YouTube.
✦ *::* *#fb* \`<link>\`
> » Descarga un video de Facebook.
*╰────────────────╯*`,
                search: `*╭─⊹ Buscadores⊹ ࣪ ˖ (╭ರ_•́)──╮*
> ✎ \`𝐁𝐮𝐬𝐜𝐚 𝐜𝐨𝐧𝐭𝐞𝐧𝐢𝐝𝐨 𝐞𝐧 𝐝𝐢𝐬𝐭𝐢𝐧𝐭𝐚𝐬 𝐩𝐥𝐚𝐭𝐚𝐟𝐨𝐫𝐦𝐚𝐬\`
✦ *::* *#googleimages* • *#gimg* \`<texto>\`
> » Busca imágenes en Google.
✦ *::* *#pinterest* \`<texto>\`
> » Busca imágenes en Pinterest.
✦ *::* *#spotify* • *#song* \`<texto>\`
> » Busca y descarga música de Spotify.
✦ *::* *#soundcloud* \`<texto>\`
> » Busca y descarga música de SoundCloud.
✦ *::* *#tiktoksearch* • *#ttss* \`<texto>\`
> » Busca videos en TikTok (carousel).
✦ *::* *#ttuser* • *#tiktokuser* \`<usuario>\`
> » Obtiene info de un usuario de TikTok.
✦ *::* *#wikipedia* • *#wiki* \`<texto>\`
> » Busca información en Wikipedia.
✦ *::* *#lyrics* • *#letra* \`<texto>\`
> » Busca letras de canciones.
✦ *::* *#apk* • *#modapk* \`<texto>\`
> » Busca y descarga aplicaciones APK.
*╰────────────────╯*`,
                utilities: `*╭─⊹ Utilidades⊹ ࣪ ˖ ꉂ(˵˃ ᗜ ˂˵)──╮*
> ✎ \`𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐮𝐭𝐢𝐥𝐢𝐝𝐚𝐝𝐞𝐬\`
✦ *::* *#ping* • *#p*
> » Calcula la velocidad del bot.
✦ *::* *#ai* • *#ia* \`<texto>\`
> » Consulta con Gemini.
✦ *::* *#gemini* \`<texto>\`
> » Consulta con Gemini AI.
✦ *::* *#copilot* \`<texto>\`
> » Habla con Microsoft Copilot AI.
✦ *::* *#claude* \`<texto>\`
> » Habla con Anthropic Claude AI.
✦ *::* *#chatgpt* • *#gpt* \`<texto>\`
> » Habla con ChatGPT AI.
✦ *::* *#sticker* • *#s*
> » Crea un sticker de una imagen o video.
✦ *::* *#toimg* • *#img*
> » Convierte un sticker en imagen.
✦ *::* *#suggest* \`<texto>\`
> » Envía una sugerencia al administrador.
✦ *::* *#hd*
> » Mejora la calidad de una imagen (responde a imagen).
✦ *::* *#obtenerinfo* \`<@user>\`
> » Obtiene información de JID de un usuario.
✦ *::* *#wanted* \`<@user>\`
> » Crea un poster de "Se Busca".
✦ *::* *#speak* \`<texto>\`
> » Convierte texto a voz (Adam).
✦ *::* *#pfp* • *#perfil* \`<@user>\`
> » Obtiene la foto de perfil de un usuario.
✦ *::* *#status* • *#estado*
> » Muestra el estado del bot (uptime, RAM, plataforma).
✦ *::* *#vision* \`<imagen>\`
> » Analiza imágenes con IA.
✦ *::* *#get* \`<url>\`
> » Realiza una petición HTTP GET.
✦ *::* *#ss* \`<url>\`
> » Toma una captura de pantalla de una web.
✦ *::* *#sora* \`<texto>\`
> » Genera un video con Sora AI.
✦ *::* *#profile*
> » Mira tu tarjeta de usuario y estadísticas.
✦ *::* *#setbirth* \`<DD/MM/YYYY>\`
> » Establece tu fecha de nacimiento.
✦ *::* *#setgen* \`<m/f>\`
> » Establece tu género.
*╰────────────────╯*`,
                fun: `*╭─⊹ Diversión⊹ ࣪ ˖ ꉂ(˵˃ ᗜ ˂˵)──╮*
> ✎ \`𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐩𝐚𝐫𝐚 𝐢𝐧𝐭𝐞𝐫𝐚𝐜𝐭𝐮𝐚𝐫\`
✦ *::* *#sleep* \`<@user>\`
> » Duerme o toma una siesta con alguien.
✦ *::* *#hug* \`<@user>\`
> » Abraza a alguien.
✦ *::* *#cry* \`<@user>\`
> » Llora por alguien o algo.
✦ *::* *#kiss* \`<@user>\`
> » Besa a alguien.
✦ *::* *#textpro* \`<efecto>\` \`<texto>\`
> » Crea imágenes con texto (neon, magma, etc).
✦ *::* *#dance* \`<@user>\`
> » Baila solo o con alguien.
✦ *::* *#kill* \`<@user>\`
> » Mata a alguien (o suicidate).
✦ *::* *#angry* \`<@user>\`
> » Muestra tu enojo.
✦ *::* *#bored* \`<@user>\`
> » Expresa tu aburrimiento.
✦ *::* *#coffee* \`<@user>\`
> » Toma café solo o acompañado.
*╰────────────────╯*`,
                games: `*╭─⊹ Juegos⊹ ࣪ ˖ ꉂ(˵˃ ᗜ ˂˵)──╮*
> ✎ \`𝐃𝐢𝐯𝐢𝐞́𝐫𝐭𝐞𝐭𝐞 𝐜𝐨𝐧 𝐞𝐬𝐭𝐨𝐬 𝐦𝐢𝐧𝐢𝐣𝐮𝐞𝐠𝐨𝐬\`
✦ *::* *#tictactoe* • *#ttt* \`<@user>\`
> » Juega al gato (tres en raya).
✦ *::* *#math*
> » Resuelve problemas matemáticos.
✦ *::* *#trivia* • *#quiz*
> » Responde preguntas y gana coins.
✦ *::* *#adivinanza* • *#adivina*
> » Resuelve adivinanzas y gana coins.
✦ *::* *#love* \`<@user>\`
> » Calculadora de amor.
✦ *::* *#gay* \`<@user>\`
> » Calculadora de porcentaje gay.
✦ *::* *#ppt* \`<piedra/papel/tijera>\`
> » Juega Piedra, Papel o Tijera.
✦ *::* *#ship* \`<@user1>\` \`<@user2>\`
> » Calcula la compatibilidad de amor entre dos personas.
✦ *::* *#fight* • *#pelea* \`<@user>\`
> » Pelea épica contra alguien (sistema de HP).
✦ *::* *#dare* • *#reto* \`<@user>\`
> » Dale un reto a alguien.
✦ *::* *#truth* • *#verdad* \`<@user>\`
> » Hazle una pregunta de verdad a alguien.
✦ *::* *#marry* • *#casar* \`<@user>\`
> » Matrimonio virtual con alguien.
*╰────────────────╯*`,
                subbot: `*╭─⊹ Subbot⊹ ࣪ ˖ (˶ᵔ ᵕ ᵔ˶)──╮*
> ✎ \`𝐂𝐨𝐧𝐯𝐢𝐞𝐫𝐭𝐞 𝐭𝐮 𝐧𝐮́𝐦𝐞𝐫𝐨 𝐞𝐧 𝐮𝐧 𝐛𝐨𝐭\`
✦ *::* *#code*
> » Obtén un código de 8 dígitos para vincular tu número.
✦ *::* *#qr* \`<código>\`
> » Obtén un código QR para vincularte.
✦ *::* *#jadibot*
> » Muestra las opciones para convertirte en subbot.
✦ *::* *#stopbot*
> » Detén tu subbot vinculado.
*╰────────────────╯*`,
                nsfw: `*╭─⊹ NSFW⊹ ࣪ ˖ (,,•᷄‎ࡇ•᷅ ,,)?──╮*
> ✎ \`𝐂𝐨𝐧𝐭𝐞𝐧𝐢𝐝𝐨 𝐩𝐚𝐫𝐚 𝐚𝐝𝐮𝐥𝐭𝐨𝐬\`
✦ *::* *#hbikini*
> » Imágenes de chicas en bikini.
✦ *::* *#himages*
> » Imágenes hentai aleatorias.
✦ *::* *#pornvideo*
> » Videos porno aleatorios.
✦ *::* *#fuck* \`<mention>\`
> » Viola a alguien.
✦ *::* *#pajawoman* \`<mention>\`
> » Hazte una paja sola o con alguien.
✦ *::* *#showtits* \`<mention>\`
> » Muestra las tetas a alguien.
*╰────────────────╯*`,
                admin: `*╭─⊹ Administración⊹ ࣪ ˖ ꉂ(˵˃ ᗜ ˂˵)──╮*
> ✎ \`𝐀𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚 𝐭𝐮 𝐠𝐫𝐮𝐩𝐨 𝐲/𝐨 𝐜𝐨𝐦𝐮𝐧𝐢𝐝𝐚𝐝\`
✦ *::* *#kick* \`<@user>\`
> » Expulsa a alguien del grupo.
✦ *::* *#ban* \`<@user>\`
> » Banea a alguien del grupo.
✦ *::* *#antilink* \`<on/off>\`
> » Activa el antilink (elimina enlaces de todos).
✦ *::* *#tag* \`<text>\`
> » Anuncia un mensaje a todo el grupo.
✦ *::* *#promote* \`<@user>\`
> » Promueve a alguien a administrador.
✦ *::* *#demote* \`<@user>\`
> » Remueve el administrador a alguien.
✦ *::* *#welcome* \`<on/off>\`
> » Activa/desactiva mensajes de bienvenida.
✦ *::* *#goodbye* \`<on/off>\`
> » Activa/desactiva mensajes de despedida.
✦ *::* *#alertas* \`<on/off>\`
> » Activa o desactiva el sistema de alertas.
✦ *::* *#kickall*
> » Elimina a todos los no-admins del grupo.
✦ *::* *#link* • *#enlace*
> » Obtiene el enlace de invitación del grupo.
✦ *::* *#gp* • *#gpinfo*
> » Información del grupo y estado de sistemas.
✦ *::* *#join* • *#invite* \`<link>\`
> » Une al bot a un grupo por link.
*╰────────────────╯*`
            };

            if (requestedSection && sections[requestedSection]) {
                helpText = `${sections[requestedSection]}
ꪆৎ *𝐓𝐢𝐩:* 𝐔𝐬𝐚 \`#𝐦𝐞𝐧𝐮\` 𝐩𝐚𝐫𝐚 𝐯𝐞𝐫 𝐭𝐨𝐝𝐚𝐬 𝐥𝐚𝐬 𝐜𝐚𝐭𝐞𝐠𝐨𝐫𝛊́𝐚𝐬 𝐝𝐢𝐬𝐩𝐨𝐧𝐢𝐛𝐥𝐞𝐬.
*𝐎𝐭𝐫𝐚𝐬 𝐜𝐚𝐭𝐞𝐠𝐨𝐫𝛊́𝐚𝐬:*
𝐞𝐜𝐨𝐧𝐨𝐦𝐢𝐚, 𝐠𝐚𝐜𝐡𝐚, 𝐝𝐞𝐬𝐜𝐚𝐫𝐠𝐚𝐬, 𝐛𝐮𝐬𝐜𝐚𝐝𝐨𝐫𝐞𝐬, 𝐮𝐭𝐢𝐥𝐢𝐝𝐚𝐝𝐞𝐬, 𝐝𝐢𝐯𝐞𝐫𝐬𝐢𝐨𝐧, 𝐣𝐮𝐞𝐠𝐨𝐬, 𝐬𝐮𝐛𝐛𝐨𝐭, 𝐧𝐬𝐟𝐰, 𝐚𝐝𝐦𝐢𝐧`;
            } else if (section && !requestedSection) {
                helpText = `❌ *Sєccιση ησ єηcσηтяα∂α:* \`${section}\`
*Categorías disponibles:*
- economia / economy
- gacha
- descargas / downloads
- buscadores / search
- utilidades / utilities
- diversion / fun
- juegos / games
- subbot
- nsfw
- admin / administracion
> *Ejemplo:* \`#menu economia\` o \`#menu economy\``;
            } else {
                helpText = `${sections.header}
${sections.economy}
${sections.gacha}
${sections.downloads}
${sections.search}
${sections.utilities}
${sections.fun}
${sections.games}
${sections.subbot}
${sections.nsfw}
${sections.admin}`;
            }
            
            await bot?.sock.sendMessage(chatId, {
                text: helpText,
                contextInfo: {
                    externalAdReply: {
                        title: botName,
                        body: "Developed By Soblend Development Studio",
                        thumbnailUrl: menuImage,
                        mediaType: 1,
                        sourceUrl: "https://bright-light.pages.dev",
                        renderLargerThumbnail: true,
                    }
                }
            });
        } catch (error) {
            console.error('[DEBUG] Error sending help with metadata:', error);
            ctx.reply(helpText);
        }
    }
};

export default command;
