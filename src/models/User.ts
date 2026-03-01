import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
    id: string;
    economy: {
        coins: number;
        bank: number;
        lastDaily: number;
        lastWork: number;
        lastCrime: number;
        lastSlut: number;
    };
    gacha: {
        characters: any[];
        lastClaim: number;
        votes?: any;
        rolled: string | null;
        lastRoll: number;
        lastVote?: number;
    };
    stats: {
        messages: number;
        commands: number;
    };
    level: {
        xp: number;
        lvl: number;
        lastXp: number;
    };
    inventory: any[];
    createdAt: number;
    monedas: number;
    antirobo: number;
    desbloqueo: number;
    profile?: {
        name?: string;
        description?: string;
        avatar?: string;
        background?: string;
        birthday?: string;
        gender?: string;
    };
    name?: string;
    xp?: number;
}

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    economy: {
        coins: { type: Number, default: 0 },
        bank: { type: Number, default: 0 },
        lastDaily: { type: Number, default: 0 },
        lastWork: { type: Number, default: 0 },
        lastCrime: { type: Number, default: 0 },
        lastSlut: { type: Number, default: 0 }
    },
    gacha: {
        characters: { type: Array, default: [] },
        lastClaim: { type: Number, default: 0 },
        votes: { type: Object, default: {} },
        rolled: { type: String, default: null },
        lastRoll: { type: Number, default: 0 }
    },
    stats: {
        messages: { type: Number, default: 0 },
        commands: { type: Number, default: 0 }
    },
    level: {
        xp: { type: Number, default: 0 },
        lvl: { type: Number, default: 1 },
        lastXp: { type: Number, default: 0 }
    },
    inventory: { type: Array, default: [] },
    createdAt: { type: Number, default: Date.now },
    monedas: { type: Number, default: 0 },
    antirobo: { type: Number, default: 0 },
    desbloqueo: { type: Number, default: 0 }
}, { strict: false });

UserSchema.index({ 'economy.coins': -1 });
UserSchema.index({ 'economy.bank': -1 });
UserSchema.index({ 'level.xp': -1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
