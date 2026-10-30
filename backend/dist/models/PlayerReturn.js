"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerReturn = void 0;
const mongoose_1 = require("mongoose");
const PlayerReturnSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', index: true },
    playerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
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
    tournamentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tournament' },
    matchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Match' },
    transactionRef: { type: String, trim: true },
    notes: { type: String },
}, { timestamps: true });
PlayerReturnSchema.index({ tenantId: 1, playerId: 1, returnDate: -1 });
exports.PlayerReturn = (0, mongoose_1.model)('PlayerReturn', PlayerReturnSchema);
