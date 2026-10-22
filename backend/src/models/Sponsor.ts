import { Schema, model, Document, Types } from 'mongoose';

export type SponsorTxType = 'investment' | 'payout';

export interface ISponsorTransaction {
  _id: Types.ObjectId;
  type: SponsorTxType;
  amount: number;
  date: Date;
  method?: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'cheque' | 'other';
  reference?: string;
  tournamentId?: Types.ObjectId;
  notes?: string;
  createdAt?: Date;
}

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
  /** Ledger of every inflow (investment) and outflow (payout). Totals above are derived from it. */
  transactions: Types.DocumentArray<ISponsorTransaction & Document>;
  recalculateTotals(): void;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorTransactionSchema = new Schema<ISponsorTransaction>(
  {
    type: { type: String, enum: ['investment', 'payout'], required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'other'],
      default: 'cash',
    },
    reference: { type: String, trim: true },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    notes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

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
    transactions: { type: [SponsorTransactionSchema], default: [] },
  },
  { timestamps: true }
);

/** Recompute cached totals + first-investment / last-payout dates from the ledger. */
SponsorSchema.methods.recalculateTotals = function (this: ISponsor) {
  const txs = this.transactions || [];
  const investments = txs.filter((t) => t.type === 'investment');
  const payouts = txs.filter((t) => t.type === 'payout');

  this.amountInvested = investments.reduce((acc, t) => acc + (t.amount || 0), 0);
  this.returnsPaid = payouts.reduce((acc, t) => acc + (t.amount || 0), 0);

  if (investments.length > 0) {
    this.investmentDate = new Date(Math.min(...investments.map((t) => new Date(t.date).getTime())));
  }
  this.returnDate =
    payouts.length > 0
      ? new Date(Math.max(...payouts.map((t) => new Date(t.date).getTime())))
      : undefined;
};

SponsorSchema.index({ tenantId: 1, teamId: 1, investmentDate: -1 });

export const Sponsor = model<ISponsor>('Sponsor', SponsorSchema);
