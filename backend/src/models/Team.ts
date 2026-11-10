import { Schema, model, Document, Types } from 'mongoose';
import { TeamType } from '../enums';
import { SYSTEM_DEFAULTS } from '../constants';

export interface ITeam extends Document {
  tenantId: Types.ObjectId;
  captainId?: Types.ObjectId;
  name: string;
  shortName: string;
  teamType?: string;
  phone?: string;
  city?: string;
  logo?: string;
  primaryColor?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    captainId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, uppercase: true, trim: true },
    teamType: { type: String, enum: Object.values(TeamType), default: TeamType.MY_TEAM },
    phone: { type: String, trim: true },
    city: { type: String, default: SYSTEM_DEFAULTS.CITY },
    logo: { type: String },
    primaryColor: { type: String, default: SYSTEM_DEFAULTS.PRIMARY_COLOR },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TeamSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Team = model<ITeam>('Team', TeamSchema);
