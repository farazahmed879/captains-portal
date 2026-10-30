"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = void 0;
const mongoose_1 = require("mongoose");
const ExpenseSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    tournamentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tournament' },
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
}, { timestamps: true });
ExpenseSchema.index({ tenantId: 1, teamId: 1, expenseDate: -1 });
exports.Expense = (0, mongoose_1.model)('Expense', ExpenseSchema);
