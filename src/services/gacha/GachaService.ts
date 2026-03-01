import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LocalDB } from '@imjxsx/localdb';
import { DATA_PATHS } from '../../config/data.js';
import { globalLogger as logger } from '../../utils/Logger.js';
import { normalizeUserId } from '../../utils/permissions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GachaService {
    characters: any[];
    characterIndex: Map<string, number>;
    sourceIndex: Map<string, number[]>;
    genderIndex: Map<string, number[]>;
    loaded: boolean;
    db: any;
    collection: any;
    bsonPath: string;

    constructor() {
        this.characters = [];
        this.characterIndex = new Map();
        this.sourceIndex = new Map();
        this.genderIndex = new Map();
        this.loaded = false;
        const basePath = path.dirname(DATA_PATHS.CHARACTERS);
        this.db = new LocalDB(basePath).db('gacha_db');
        this.collection = this.db.collection('characters');
        this.bsonPath = path.join(basePath, 'gacha_db', 'characters.bson');
    }

    async load() {
        if (this.loaded) return this;
        try {
            logger.info('Cargando personajes...');
            let loadSource = 'BSON (LocalDB)';
            await this.db.load();
            let jsonStats, bsonStats;
            try { jsonStats = await fs.promises.stat(DATA_PATHS.CHARACTERS); } catch (e) { }
            try { bsonStats = await fs.promises.stat(this.bsonPath); } catch (e) { }
            if (jsonStats && (!bsonStats || jsonStats.mtime > bsonStats.mtime)) {
                logger.info('[Gacha] JSON más reciente que BSON. Regenerando BSON...');
                if (bsonStats) await fs.promises.unlink(this.bsonPath).catch(() => { });
                await this.db.load();
                const raw = await fs.promises.readFile(DATA_PATHS.CHARACTERS, 'utf8');
                const data = JSON.parse(raw);
                if (this.collection.insertMany) this.collection.insertMany(data);
                else data.forEach((d: any) => this.collection.insertOne(d));
                await this.db.save();
                loadSource = 'JSON -> BSON Sync';
            } else await this.db.load();
            this.characters = this.collection.find({});
            if (!this.characters) this.characters = [];
            this.indexCharacters();
            logger.info(`${this.characters.length} personajes cargados (${loadSource})`);
            this.loaded = true;
        } catch (err) {
            logger.error('Error fatal en GachaService:', err);
            const raw = await fs.promises.readFile(DATA_PATHS.CHARACTERS, 'utf8');
            this.characters = JSON.parse(raw);
            this.indexCharacters();
        }
        return this;
    }

    indexCharacters() {
        this.characterIndex.clear();
        this.sourceIndex.clear();
        this.genderIndex.clear();
        for (let i = 0; i < this.characters.length; i++) {
            const char = this.characters[i];
            if (char.id) this.characterIndex.set(String(char.id), i);
            if (char.name) this.characterIndex.set(char.name.toLowerCase(), i);
            if (char.source) {
                const source = char.source.toLowerCase();
                if (!this.sourceIndex.has(source)) this.sourceIndex.set(source, []);
                this.sourceIndex.get(source)!.push(i);
            }
            if (char.gender) {
                const gender = char.gender.toLowerCase();
                if (!this.genderIndex.has(gender)) this.genderIndex.set(gender, []);
                this.genderIndex.get(gender)!.push(i);
            }
        }
    }

    getById(id: string | number) {
        const index = this.characterIndex.get(String(id));
        return index !== undefined ? this.characters[index] : null;
    }

    getByName(name: string) {
        const index = this.characterIndex.get(name.toLowerCase());
        return index !== undefined ? this.characters[index] : null;
    }

    getBySource(source: string) {
        const indices = this.sourceIndex.get(source.toLowerCase()) || [];
        return indices.map(i => this.characters[i]);
    }

    getByGender(gender: string) {
        const indices = this.genderIndex.get(gender.toLowerCase()) || [];
        return indices.map(i => this.characters[i]);
    }

    getByOwner(userId: string) {
        const normalizedUserId = normalizeUserId(userId);
        return this.characters.filter(c => {
            const normalizedOwner = normalizeUserId(c.owner);
            return normalizedOwner === normalizedUserId;
        });
    }

    getRandomCharacter(filter: any = null) {
        let pool = this.characters;
        if (filter) {
            if (filter.gender) pool = this.getByGender(filter.gender);
            else if (filter.source) pool = this.getBySource(filter.source);
        }
        if (filter?.onlyFree) pool = pool.filter(c => !c.owner && (!c.status || c.status.toLowerCase() === 'libre'));
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getFreeCharacters() {
        return this.characters.filter(c => !c.owner && (!c.status || c.status.toLowerCase() === 'libre'));
    }

    async updateCharacter(id: string | number, updates: any) {
        const index = this.characterIndex.get(String(id));
        if (index === undefined) return false;
        Object.assign(this.characters[index], updates);
        this.collection.updateOne({ id: String(id) }, updates);
        await this.save();
        return true;
    }

    async addCharacter(character: any) {
        if (!character.id) {
            const maxId = Math.max(...this.characters.map(c => parseInt(c.id) || 0), 0);
            character.id = String(maxId + 1);
        }
        this.characters.push(character);
        this.indexCharacters();
        this.collection.insertOne(character);
        await this.save();
        return character;
    }

    async save() {
        try {
            await this.db.save();
            await fs.promises.writeFile(DATA_PATHS.CHARACTERS, JSON.stringify(this.characters, null, 2), 'utf8');
            return true;
        } catch (error: any) {
            logger.error('Error guardando personajes (Dual Sync):', error.message);
            return false;
        }
    }

    getStats() {
        const free = this.getFreeCharacters().length;
        const owned = this.characters.length - free;
        return { total: this.characters.length, free, owned, sources: this.sourceIndex.size, indexed: this.characterIndex.size };
    }

    async claim(userId: string, characterId: string | number) {
        const character = this.getById(characterId);
        if (!character) throw new Error('Personaje no encontrado');
        if (character.owner) throw new Error('El personaje ya tiene dueño');
        const updates = { owner: userId, status: 'Ocupado' };
        await this.updateCharacter(characterId, updates);
        return true;
    }

    async transferCharacter(characterId: string | number, newOwnerId: string) {
        const character = this.getById(characterId);
        if (!character) throw new Error('Personaje no encontrado');
        const previousOwner = character.owner;
        const updates = { owner: newOwnerId, user: newOwnerId };
        await this.updateCharacter(characterId, updates);
        return { character, previousOwner };
    }

    vote(userId: string, characterId: string | number) {
        const character = this.getById(characterId);
        if (!character) return { success: false, message: 'Personaje no encontrado' };
        if (!character.votes) character.votes = 0;
        character.votes += 1;
        character.value = (parseInt(character.value) || 0) + 10;
        this.updateCharacter(characterId, { votes: character.votes, value: character.value });
        return { success: true, character };
    }

    async gracefulShutdown() {
        logger.info('ꕢ Guardando datos de GachaService (BSON)...');
        await this.save();
        return true;
    }
}

export default GachaService;
