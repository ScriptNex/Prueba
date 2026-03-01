export const CLOUDFLARE_CONFIG = {
    API_TOKEN: process.env.CF_TOKEN || '',
    ZONE_ID: process.env.CF_ZONE || '',
    ACCOUNT_ID: process.env.CF_ACCOUNT_ID || '',
    VISION_MODEL: process.env.CF_VISION_MODEL || '@cf/llava-v1.6-34b',
    MAX_TOKENS: parseInt(process.env.CF_MAX_TOKENS || '512')
};

export default CLOUDFLARE_CONFIG;
