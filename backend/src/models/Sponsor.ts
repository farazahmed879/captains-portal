import { Schema, model, Document, Types } from 'mongoose';

export interface ISponsor extends Document {
  tenantId: Types.ObjectId;
  teamId: Types.ObjectId;
  tournamentId?: Types.ObjectId;
  sponsorName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  amountInvested: number;
  investmentDate: Date;
  contractType:
    | 'jersey_front'
    | 'jersey_back'
    | 'sleeve'
    | 'tournament_banner'
    | 'equipment_kit'
    | 'general_grant';
  returnsPaid: number;
  returnDate?: Date;
  deliverablesAgreed?: string;
  status: 'pledged' | 'active' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorSchema = new Schema<ISponsor>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    sponsorName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    amountInvested: { type: Number, required: true, default: 0 },
    investmentDate: { type: Date, required: true, default: Date.now },
    contractType: {
      type: String,
      enum: [
        'jersey_front',
        'jersey_back',
        'sleeve',
        'tournament_banner',
        'equipment_kit',
        'general_grant',
      ],
      default: 'general_grant',
    },
    returnsPaid: { type: Number, default: 0 },
    returnDate: { type: Date },
    deliverablesAgreed: { type: String },
    status: {
      type: String,
      enum: ['pledged', 'active', 'completed'],
      default: 'active',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

SponsorSchema.index({ tenantId: 1, teamId: 1, investmentDate: -1 });

export const Sponsor = model<ISponsor>('Sponsor', SponsorSchema);
