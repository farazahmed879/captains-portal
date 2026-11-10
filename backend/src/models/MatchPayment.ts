import { Schema, model, Document, Types } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '../enums';

export interface IMatchPayment extends Document {
  tenantId: Types.ObjectId;
  teamId: Types.ObjectId;
  matchId: Types.ObjectId;
  playerId: Types.ObjectId;
  feeAssigned: number;
  feePaid: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paymentMethod: 'cash' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'other';
  paymentDate?: Date;
  transactionRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchPaymentSchema = new Schema<IMatchPayment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    feeAssigned: { type: Number, required: true, default: 0 },
    feePaid: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
    },
    paymentDate: { type: Date },
    transactionRef: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

MatchPaymentSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
MatchPaymentSchema.index({ tenantId: 1, playerId: 1 });

export const MatchPayment = model<IMatchPayment>('MatchPayment', MatchPaymentSchema);
