import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  tenantId: Types.ObjectId;
  captainId: Types.ObjectId;
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
    captainId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, uppercase: true, trim: true },
    teamType: { type: String, default: 'my_team' },
    phone: { type: String, trim: true },
    city: { type: String, default: 'Karachi' },
    logo: { type: String },
    primaryColor: { type: String, default: '#0284c7' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TeamSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Team = model<ITeam>('Team', TeamSchema);
