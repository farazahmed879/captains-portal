import { Schema, model, Document, Types } from 'mongoose';

export interface ITournament extends Document {
  tenantId: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  organizer?: string;
  venue?: string;
  format: 'T20' | 'Tape Ball' | 'Hard Ball' | 'T10' | '100 Balls' | 'Other';
  startDate: Date;
  endDate?: Date;
  entryFee: number;
  expectedWinningPrize?: number;
  actualWinningPrizeWon?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'knocked_out' | 'champions';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    name: { type: String, required: true, trim: true },
    organizer: { type: String, trim: true },
    venue: { type: String, trim: true },
    format: {
      type: String,
      enum: ['T20', 'Tape Ball', 'Hard Ball', 'T10', '100 Balls', 'Other'],
      default: 'T20',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    entryFee: { type: Number, default: 0 },
    expectedWinningPrize: { type: Number, default: 0 },
    actualWinningPrizeWon: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'knocked_out', 'champions'],
      default: 'ongoing',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

TournamentSchema.index({ tenantId: 1, teamId: 1, name: 1 });

export const Tournament = model<ITournament>('Tournament', TournamentSchema);
