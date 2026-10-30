"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchPayment = void 0;
const mongoose_1 = require("mongoose");
const MatchPaymentSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    matchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    playerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    feeAssigned: { type: Number, required: true, default: 0 },
    feePaid: { type: Number, required: true, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'pending'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'easypaisa', 'jazzcash', 'bank_transfer', 'other'],
        default: 'cash',
    },
    paymentDate: { type: Date },
    transactionRef: { type: String, trim: true },
    notes: { type: String },
}, { timestamps: true });
MatchPaymentSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
MatchPaymentSchema.index({ tenantId: 1, playerId: 1 });
exports.MatchPayment = (0, mongoose_1.model)('MatchPayment', MatchPaymentSchema);
