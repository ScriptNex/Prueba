import { formatNumber, getCooldown, formatTime, getRandom, styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

const JOBS = [
    'un señor te contrato para vender pan en la calle',
    'tú papá te dio dinero para que vayas a comprar un kilo de arroz y te dieron vuelto de mas',
    'te encontraste monedas en el suelo',
    'vendiste tu riñon',
    'viste algo que no deberias de ver y te sobornaron por quedarte callado',
    'tu vecino te pagó por cuidar a su loro que no para de gritar',
    'hiciste dulces caseros y los vendiste afuera de la escuela',
    'te pagaron por pretender ser el novio/novia falso de alguien',
    'conseguiste trabajo repartiendo volantes disfrazado de pizza',
    'lavaste autos en el semáforo con una esponja sospechosamente sucia',
    'tu tía te dio dinero solo por decirle que estaba más joven',
    'participaste en un experimento raro de la universidad',
    'vendiste tus apuntes de clase a compañeros desesperados',
    'te pagaron por hacer fila en lugar de otra persona',
    'encontraste una billetera y te quedaste con la recompensa',
    'trabajaste como extra en una película que nadie va a ver',
    'tu abuela te pagó por enseñarle a usar WhatsApp por centésima vez',
    'vendiste cosas viejas en un mercado de pulgas',
    'hiciste mandados para los vecinos del edificio',
    'ganaste una apuesta absurda con tus amigos',
    'te pagaron por ser el chofer de alguien que estaba muy cansado',
    'vendiste limonada en la puerta de tu casa y solo compró tu mamá',
    'tu primo te pagó por hacerle la tarea de matemáticas',
    'conseguiste trabajo como payaso en fiestas infantiles traumatizantes',
    'te pagaron por aplaudir en un evento super aburrido',
    'vendiste fotos de tus pies en internet',
    'limpiaste la casa de un señor que tiene 47 gatos',
    'te pagaron por fingir que eres amigo de alguien en redes sociales',
    'trabajaste cargando bolsas en el supermercado',
    'le cortaste el pasto a tu vecino con unas tijeras',
    'vendiste empanadas que hizo tu mamá y te quedaste con las ganancias',
    'te encontraste dinero en el bolsillo de un pantalón viejo',
    'trabajaste repartiendo periódicos a las 5 am',
    'te pagaron por deletrear palabras difíciles en un concurso',
    'vendiste pulseras hechas a mano en la feria',
    'conseguiste dinero devolviendo botellas reciclables',
    'tu tío te pagó por instalarle una aplicación en el celular',
    'trabajaste como modelo de manos para anuncios baratos',
    'te pagaron por probar comida de un restaurante nuevo',
    'vendiste tu colección de cartas pokémon al niño del vecindario',
    'trabajaste paseando perros que te arrastraron por toda la cuadra',
    'te pagaron por gritar gol en un partido de fútbol amateur',
    'vendiste tareas escolares por internet',
    'conseguiste trabajo pintando caras en una kermés',
    'te pagaron por ser la audiencia de un comediante sin talento',
    'trabajaste limpiando peceras llenas de algas',
    'vendiste calcomanías personalizadas que nadie pidió',
    'te pagaron por traducir memes a tus tíos',
    'conseguiste dinero apostando quién aguanta más sin pestañear',
    'trabajaste inflando globos hasta que casi te desmayaste',
    'te pagaron por organizar el clóset de alguien muy desorganizado',
    'vendiste gomitas que parecían caseras pero eran del mercado',
    'trabajaste de DJ en una fiesta donde nadie bailó',
    'te pagaron por contar chistes malos en un micrófono',
    'conseguiste trabajo limpiando los vidrios de un edificio pequeño',
    'vendiste plantas que "rescataste" del jardín de tu casa',
    'te pagaron por hacer yoga con cabras',
    'trabajaste como estatua humana y te salieron calambres',
    'vendiste café de tu termo en la universidad',
    'te pagaron por editar fotos para que la gente se vea mejor',
    'conseguiste trabajo armando muebles con instrucciones en chino',
    'vendiste artesanías que claramente hiciste en 5 minutos',
    'te pagaron por ser el árbitro en peleas de almohadas',
    'trabajaste organizando cables que nadie más quería tocar',
    'vendiste brackets usados como joyería vintage',
    'te pagaron por leer cuentos a niños hiperactivos',
    'conseguiste trabajo probando colchones en una tienda',
    'vendiste tu cuenta de videojuegos con personajes nivel máximo',
    'te pagaron por ser el cámara de bodas con tu celular',
    'trabajaste dando clases de baile sin saber bailar',
    'vendiste "antigüedades" que encontraste en tu garaje',
    'te pagaron por crear memes corporativos horribles',
    'conseguiste trabajo probando videojuegos con bugs',
    'vendiste servicios de "consultoría" sin tener idea del tema',
    'te pagaron por escribir reseñas falsas en internet',
    'trabajaste como actor de voz para anuncios de radio local',
    'vendiste tu plasma sanguíneo dos veces en un mes',
    'te pagaron por ordenar la biblioteca de alguien obsesivo',
    'conseguiste trabajo probando toboganes acuáticos',
    'vendiste magdalenas quemadas como "artesanales y rústicas"',
    'te pagaron por espantar pájaros de un cultivo',
    'trabajaste haciendo encuestas telefónicas a gente enojada',
    'vendiste entradas falsas para un concierto que no existía',
    'te pagaron por ser el blanco en una clase de lanzamiento de cuchillos',
    'conseguiste trabajo probando alarmas de humo',
    'vendiste consejos de vida por mensaje de texto',
    'te pagaron por fingir ser cliente satisfecho en un negocio vacío',
    'trabajaste poniendo cejas postizas a maniquíes',
    'vendiste piedras pintadas como "mascotas de bajo mantenimiento"',
    'te pagaron por aplaudir en un programa de televisión grabado',
    'conseguiste trabajo contando autos en una carretera',
    'vendiste tus libros de texto subrayados como "pre-estudiados"',
    'te pagaron por dormir en un estudio del sueño',
    'trabajaste como probador profesional de sillas de oficina',
    'vendiste agua de coco directamente del coco con sobreprecio',
    'te pagaron por hacerte pasar por turista en fotos',
    'conseguiste trabajo clasificando dulces por color',
    'vendiste arena de la playa como "recuerdo auténtico"',
    'te pagaron por ser extra en un video musical cutre',
    'trabajaste limpiando estatuas en el parque',
    'vendiste "coaching motivacional" por videollamada',
    'te pagaron por contar historias de terror a campistas',
    'conseguiste trabajo probando efectos de sonido para películas',
    'vendiste tu silencio después de ver algo comprometedor',
    'te pagaron por ser maniquí humano en un escaparate',
    'trabajaste envolviendo regalos en época navideña',
    'vendiste horóscopos personalizados completamente inventados',
    'te pagaron por fingir ser familiar en una reunión incómoda',
    'conseguiste trabajo siendo la voz de un GPS mal programado',
    'vendiste chicles de máquina a precio premium',
    'te pagaron por organizar una despedida de soltero desastrosa',
    'trabajaste como "influencer" con 12 seguidores',
    'vendiste tutoriales de cómo hacer cosas que no sabes hacer',
    'te pagaron por ser el villano en una obra de teatro escolar',
    'conseguiste trabajo probando protectores solares en tu piel',
    'vendiste cromos repetidos a coleccionistas desesperados',
    'te pagaron por fingir que entiendes de vinos en una cata',
    'trabajaste separando basura reciclable de no reciclable',
    'vendiste predicciones del futuro usando una bola mágica de juguete',
    'te pagaron por ser el compañero de gimnasio de alguien sin motivación',
    'conseguiste trabajo limpiando pelotas de tenis usadas',
    'vendiste cursos online sobre temas que acabas de googlear',
    'te pagaron por ser juez en un concurso de mascotas feas',
    'trabajaste disfrazado de mascota corporativa en el calor infernal',
    'vendiste "arte abstracto" hecho con manchas de café',
    'te pagaron por escribir cartas de amor para gente sin creatividad'
];

const command: Command = {
    commands: ['work', 'w'],
    async execute(ctx: CommandContext) {
        if (ctx.isGroup) {
            const groupData = await ctx.dbService.getGroup(ctx.chatId);
            if (!groupData?.settings?.economy) {
                return await ctx.reply(styleText('ꕢ El sistema de economía está desactivado en este grupo.'));
            }
        }
        
        const currencyName = await getCurrencyName(ctx);
        const COOLDOWN = 1 * 60 * 1000;
        const REWARD = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        
        const userData = await ctx.dbService.getUser(ctx.sender);
        const lastWork = userData.economy?.lastWork || 0;
        const cooldown = getCooldown(lastWork, COOLDOWN);
        
        if (cooldown > 0) {
            return await ctx.reply(styleText(
                `ꕢ Estás cansado, descansa un poco.\n> Vuelve en » ${formatTime(cooldown)}`
            ));
        }

        const currentCoins = userData.economy?.coins || 0;
        await ctx.dbService.updateUser(ctx.sender, {
            'economy.lastWork': Date.now(),
            'economy.coins': currentCoins + REWARD
        });
        
        const job = getRandom(JOBS);
        await ctx.reply(styleText(
            `ꕣ ${job} y ganaste *¥${formatNumber(REWARD)}* ${currencyName}.`
        ));
    }
};

export default command;
