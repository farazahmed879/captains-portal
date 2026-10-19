import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  tenantId: Types.ObjectId;
  teamId: Types.ObjectId;
  tournamentId?: Types.ObjectId;
  category:
    | 'equipment'
    | 'kit_jerseys'
    | 'tournament_entry_fee'
    | 'ground_booking'
    | 'refreshment'
    | 'transport'
    | 'medication'
    | 'other';
  title: string;
  amount: number;
  expenseDate: Date;
  paidBy: string;
  receiptUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    category: {
      type: String,
      enum: [
        'equipment',
        'kit_jerseys',
        'tournament_entry_fee',
        'ground_booking',
        'refreshment',
        'transport',
        'medication',
        'other',
      ],
      required: true,
      default: 'equipment',
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    paidBy: { type: String, default: 'Captain' },
    receiptUrl: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.index({ tenantId: 1, teamId: 1, expenseDate: -1 });

export const Expense = model<IExpense>('Expense', ExpenseSchema);
