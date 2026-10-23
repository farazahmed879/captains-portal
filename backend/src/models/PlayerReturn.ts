import { Schema, model, Document, Types } from 'mongoose';

export type PlayerReturnSource =
  | 'winning_prize'
  | 'sponsorship'
  | 'excess_fee_refund'
  | 'contribution_return'
  | 'other';

export interface IPlayerReturn extends Document {
  tenantId: Types.ObjectId;
  teamId?: Types.ObjectId;
  playerId: Types.ObjectId;
  amount: number;
  returnDate: Date;
  source: PlayerReturnSource;
  reason?: string;
  paymentMethod: 'cash' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'cheque' | 'other';
  tournamentId?: Types.ObjectId;
  matchId?: Types.ObjectId;
  transactionRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerReturnSchema = new Schema<IPlayerReturn>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    returnDate: { type: Date, required: true, default: Date.now },
    source: {
      type: String,
      enum: ['winning_prize', 'sponsorship', 'excess_fee_refund', 'contribution_return', 'other'],
      default: 'excess_fee_refund',
    },
    reason: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'easypaisa', 'jazzcash', 'bank_transfer', 'cheque', 'other'],
      default: 'cash',
    },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
    transactionRef: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

PlayerReturnSchema.index({ tenantId: 1, playerId: 1, returnDate: -1 });

export const PlayerReturn = model<IPlayerReturn>('PlayerReturn', PlayerReturnSchema);
