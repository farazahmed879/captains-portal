import { Schema, model, Document, Types } from 'mongoose';
import { MatchType, MatchStage, MatchResult } from '../enums';

export interface IMatch extends Document {
  tenantId: Types.ObjectId;
  teamId: Types.ObjectId;
  matchType: 'friendly' | 'tournament';
  tournamentId?: Types.ObjectId;
  tournamentStage?: 'group' | 'quarter_final' | 'semi_final' | 'final' | 'regular';
  matchDate: Date;
  opponentTeam: string;
  venue: string;
  overs: number;
  
  // Expenses for the match
  groundCost: number;
  umpireCost: number;
  ballCost: number;
  refreshmentCost: number;
  otherCosts: number;
  totalMatchExpense: number;

  // Reimbursement / deduction against tournament entry fee
  isReimbursed?: boolean;
  reimbursedAmount?: number;

  // Player Fee distribution
  perPlayerFee: number;
  squadPlayerIds: Types.ObjectId[];

  // Outcome & Returns
  result: 'won' | 'lost' | 'draw' | 'tied' | 'upcoming' | 'cancelled';
  teamScore?: string;
  opponentScore?: string;
  winningPrizeMoney: number;

  // Man of the Match
  momPlayerId?: Types.ObjectId;
  momAwardDetails?: string;
  momPrizeMoney: number;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    matchType: {
      type: String,
      enum: Object.values(MatchType),
      required: true,
      default: MatchType.FRIENDLY,
    },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    tournamentStage: {
      type: String,
      enum: Object.values(MatchStage),
      default: MatchStage.REGULAR,
    },
    matchDate: { type: Date, required: true },
    opponentTeam: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    overs: { type: Number, default: 20 },

    groundCost: { type: Number, default: 0 },
    umpireCost: { type: Number, default: 0 },
    ballCost: { type: Number, default: 0 },
    refreshmentCost: { type: Number, default: 0 },
    otherCosts: { type: Number, default: 0 },
    totalMatchExpense: { type: Number, default: 0 },

    isReimbursed: { type: Boolean, default: false },
    reimbursedAmount: { type: Number, default: 0 },

    perPlayerFee: { type: Number, default: 0 },
    squadPlayerIds: [{ type: Schema.Types.ObjectId, ref: 'Player' }],

    result: {
      type: String,
      enum: Object.values(MatchResult),
      default: MatchResult.UPCOMING,
    },
    teamScore: { type: String, trim: true },
    opponentScore: { type: String, trim: true },
    winningPrizeMoney: { type: Number, default: 0 },

    momPlayerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    momAwardDetails: { type: String },
    momPrizeMoney: { type: Number, default: 0 },

    notes: { type: String },
  },
  { timestamps: true }
);

MatchSchema.index({ tenantId: 1, teamId: 1, matchDate: -1 });

export const Match = model<IMatch>('Match', MatchSchema);
