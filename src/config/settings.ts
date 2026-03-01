export const SETTINGS = {
    DEBUG: process.env.DEBUG === 'true',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export default SETTINGS;
