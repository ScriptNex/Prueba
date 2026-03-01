export const PREFIXES: string[] = ['/', '!', '#', '.', ':', "?:"];
export const DEFAULT_PREFIX: string = '#';
export const OWNER_JID: string = '639972367773@s.whatsapp.net';
export const CACHE_TTL = { DEFAULT: 300, USER_DATA: 120, GROUP_METADATA: 600, MEDIA: 3600 };
export const RATE_LIMIT = { COMMAND_COOLDOWN: 1000, SPAM_THRESHOLD: 5, SPAM_WINDOW: 10000, SPAM_TIMEOUT: 30000 };
export const TIMEOUTS = { STREAM: 30000, API_REQUEST: 15000, DB_SAVE: 10000 };
export const AUTO_SAVE_INTERVAL: number = 10000;
export const STREAM = { MAX_SIZE: 25 * 1024 * 1024, RETRY_ATTEMPTS: 3, RETRY_DELAY: 1000 };
export const ERRORS = {
    COMMAND_NOT_FOUND: 'ꕢ Comando no encontrado.',
    RATE_LIMITED: 'ꕢ Estás enviando comandos muy rápido. Espera un momento.',
    SPAM_DETECTED: 'ꕢ Has sido silenciado por spam. Espera 30 segundos.',
    GENERIC_ERROR: 'ꕢ Ocurrió un error al ejecutar el comando.',
    DB_ERROR: 'ꕢ Error de base de datos. Inténtalo de nuevo.',
    PERMISSION_DENIED: 'ꕢ No tienes permiso para usar este comando.'
};
export const SUCCESS = { COMMAND_EXECUTED: '✅ Comando ejecutado correctamente.' };

export default { PREFIXES, DEFAULT_PREFIX, OWNER_JID, CACHE_TTL, RATE_LIMIT, TIMEOUTS, AUTO_SAVE_INTERVAL, STREAM, ERRORS, SUCCESS };
