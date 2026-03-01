import { styleText, formatNumber } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface Riddle {
    respuesta: string;
    pista: string;
    timestamp: number;
}

const adivinanzas = [
    { pregunta: "Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.", respuesta: "pera", pista: "Es una fruta" },
    { pregunta: "Oro parece, plata no es. Abre la cortina y verás lo que es.", respuesta: "platano", pista: "Fruta amarilla" },
    { pregunta: "Tiene dientes y no come, tiene cabeza y no es hombre.", respuesta: "ajo", pista: "Está en la cocina" },
    { pregunta: "Choco entre dos paredes, late mi corazón. El que no lo adivine, es un cabezón.", respuesta: "chocolate", pista: "Es dulce" },
    { pregunta: "Soy redondo como el mundo, al morir me vuelvo duro, y si me ponen al horno, sigo siendo un gran pan duro.", respuesta: "pan", pista: "Se come en el desayuno" },
    { pregunta: "Tengo agujas y no sé coser, tengo números y no sé leer.", respuesta: "reloj", pista: "Marca el tiempo" },
    { pregunta: "Vuelo sin alas, silbo sin boca, no me puedes ver ni tocar.", respuesta: "viento", pista: "Está en el aire" },
    { pregunta: "Cuanto más grande, menos se ve.", respuesta: "oscuridad", pista: "Aparece de noche" },
    { pregunta: "Tiene cuatro patas pero no puede andar.", respuesta: "mesa", pista: "Es un mueble" },
    { pregunta: "Entre más le quitas, más grande se hace.", respuesta: "hoyo", pista: "Está en el suelo" },
    { pregunta: "Siempre quietas, siempre inquietas, dormidas de día, de noche despiertas.", respuesta: "estrellas", pista: "Están en el cielo" },
    { pregunta: "Soy un animal pequeñito, que vuela buscando miel, soy de rayitas amarillas y negras en mi piel.", respuesta: "abeja", pista: "Hace miel" },
    { pregunta: "Tengo cabeza redonda, sin nariz, ojos ni frente, y mi cuerpo se compone tan solo de blancos dientes.", respuesta: "ajo", pista: "Es blanco" },
    { pregunta: "Sin el aire yo no vivo, sin la tierra yo me muero, tengo yemas sin ser huevo, tengo copa y no sombrero.", respuesta: "arbol", pista: "Tiene hojas" },
    { pregunta: "Viste de chaleco blanco y también de negro frac, es un ave que no vuela pero nada, ¿qué será?", respuesta: "pinguino", pista: "Vive en el frío" },
    { pregunta: "¿Cuál es el animal que siempre llega al final?", respuesta: "delfin", pista: "Vive en el mar" },
    { pregunta: "De bello he de presumir, soy blanco como la cal, todos me saben abrir, nadie me sabe cerrar.", respuesta: "huevo", pista: "Sale de una gallina" },
    { pregunta: "Muchas lamparitas muy bien colgaditas, siempre encandiladas, nadie las atiza.", respuesta: "estrellas", pista: "Brillan en la noche" },
    { pregunta: "Te lo digo y te lo repito y te lo debo avisar, que por mucho que te diga, no lo vas a adivinar.", respuesta: "te", pista: "Es una bebida" },
    { pregunta: "Todos me pisan a mí, pero yo no piso a nadie; todos preguntan por mí, yo no pregunto por nadie.", respuesta: "camino", pista: "Se usa para ir" },
    { pregunta: "¿Qué cosa es, que cuanto más le quitas, más grande está?", respuesta: "hoyo", pista: "Es un agujero" },
    { pregunta: "Soy muy bonito por delante y muy feo por detrás; te protejo de la lluvia y del frío además.", respuesta: "paraguas", pista: "Se usa cuando llueve" },
    { pregunta: "Tengo una hermana gemela y vamos siempre al compás, con la boca por delante y los ojos por detrás.", respuesta: "tijeras", pista: "Sirve para cortar" },
    { pregunta: "Largo, largo como una soga, tiene dientes como una loba.", respuesta: "zarza", pista: "Es una planta" },
    { pregunta: "No es león y tiene garra, no es pato y tiene pata.", respuesta: "garrapata", pista: "Es un insecto" },
    { pregunta: "Salgo de la sala, voy a la cocina, meneando la cola como una gallina.", respuesta: "escoba", pista: "Sirve para limpiar" },
    { pregunta: "Adivina quién soy: cuanto más lavo, más sucia voy.", respuesta: "agua", pista: "Es líquida" },
    { pregunta: "Redondo soy como el mundo, al morir me vuelvo duro, podés encontrarme en todos los desayunos.", respuesta: "huevo", pista: "De gallina" },
    { pregunta: "Si me nombras, desaparezco. ¿Qué soy?", respuesta: "silencio", pista: "No hay ruido" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe, tiene carne y no la come, tiene barba y no es hombre.", respuesta: "coco", pista: "Es tropical" }
];

const activeRiddle = new Map<string, Riddle>();

const command: Command = {
    commands: ['adivinanza', 'riddle', 'adivina'],
    tags: ['games', 'economy'],
    help: ['adivinanza'],
    async execute(ctx: CommandContext) {
        const { chatId, sender, reply, dbService } = ctx;
        if (activeRiddle.has(chatId)) {
            const riddle = activeRiddle.get(chatId)!;
            const respuestaInput = ctx.args.join(' ').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (!respuestaInput) {
                return await reply(styleText(`ꕢ *Ya hay una adivinanza activa*\n\n> Pista: *${riddle.pista}*\n\n_Responde con: /adivinanza <tu respuesta>_`));
            }
            
            const respuestaCorrecta = riddle.respuesta.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (respuestaInput.includes(respuestaCorrecta) || respuestaCorrecta.includes(respuestaInput)) {
                const reward = Math.floor(Math.random() * 1001) + 1000;
                const userData = dbService.getUser(sender);
                dbService.updateUser(sender, { 'economy.coins': (userData.economy?.coins || 0) + reward });
                activeRiddle.delete(chatId);
                return await reply(styleText(`ꕣ *¡Correcto!*\n\n> Respuesta » *${riddle.respuesta.charAt(0).toUpperCase() + riddle.respuesta.slice(1)}*\n> Ganaste » *¥${formatNumber(reward)}* coins\n\n_¡Usa /adivinanza para otra!_`));
            } else {
                return await reply(styleText(`ꕢ *Incorrecto*\n\n> Pista: *${riddle.pista}*\n\n_Sigue intentando..._`));
            }
        }
        
        const adivinanza = adivinanzas[Math.floor(Math.random() * adivinanzas.length)];
        activeRiddle.set(chatId, { respuesta: adivinanza.respuesta, pista: adivinanza.pista, timestamp: Date.now() });
        
        setTimeout(() => { 
            if (activeRiddle.has(chatId)) activeRiddle.delete(chatId); 
        }, 120000);
        
        await reply(styleText(`ꕣ *ADIVINANZA*\n\n> *${adivinanza.pregunta}*\n\n> Pista » *${adivinanza.pista}*\n> Premio » *¥1,000 - ¥2,000* coins\n> Tiempo » *2 minutos*\n\n_Responde con: /adivinanza <respuesta>_`));
    }
};

export default command;
