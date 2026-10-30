"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sponsor = void 0;
const mongoose_1 = require("mongoose");
const SponsorTransactionSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['investment', 'payout'], required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'other'],
        default: 'cash',
    },
    reference: { type: String, trim: true },
    tournamentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tournament' },
    notes: { type: String, trim: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
const SponsorSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    tournamentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tournament' },
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
}, { timestamps: true });
/** Recompute cached totals + first-investment / last-payout dates from the ledger. */
SponsorSchema.methods.recalculateTotals = function () {
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
exports.Sponsor = (0, mongoose_1.model)('Sponsor', SponsorSchema);
