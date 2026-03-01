import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATABASE_CONFIG = {
    URL: process.env.MONGO_URL || 'mongodb://localhost:27017/alya_kujou',
    OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
};

export const DATA_PATHS = {
    CHARACTERS: path.join(process.cwd(), 'src', 'data', 'characters.json'),
    TOKENS: path.join(process.cwd(), 'src', 'data', 'tokens.json'),
    GROUPS: path.join(process.cwd(), 'src', 'data', 'groups.json'),
    USERS: path.join(process.cwd(), 'src', 'data', 'users.json'),
    ECONOMY_SEASON: path.join(process.cwd(), 'src', 'data', 'economy_season.json')
};

export default DATABASE_CONFIG;
