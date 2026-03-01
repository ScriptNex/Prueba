import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroupSettings {
    welcome: boolean;
    goodbye: boolean;
    antilink: boolean;
    economy: boolean;
    nsfw: boolean;
    alerts: boolean;
    currencyName: string;
}

export interface IGroup extends Document {
    id: string;
    settings: IGroupSettings;
    alerts: any[];
    stats: {
        messages: number;
    };
    primaryBot: string | null;
}

const GroupSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    settings: {
        welcome: { type: Boolean, default: false },
        goodbye: { type: Boolean, default: false },
        antilink: { type: Boolean, default: false },
        economy: { type: Boolean, default: true },
        nsfw: { type: Boolean, default: false },
        alerts: { type: Boolean, default: false },
        currencyName: { type: String, default: 'coins' }
    },
    alerts: { type: Array, default: [] },
    stats: {
        messages: { type: Number, default: 0 }
    },
    primaryBot: { type: String, default: null }
}, { strict: false });

GroupSchema.index({ 'settings.welcome': 1 });
GroupSchema.index({ 'settings.alerts': 1 });

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);

export default Group;
