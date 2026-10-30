"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const mongoose_1 = require("mongoose");
const MatchSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    matchType: {
        type: String,
        enum: ['friendly', 'tournament'],
        required: true,
        default: 'friendly',
    },
    tournamentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tournament' },
    tournamentStage: {
        type: String,
        enum: ['group', 'quarter_final', 'semi_final', 'final', 'regular'],
        default: 'regular',
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
    perPlayerFee: { type: Number, default: 0 },
    squadPlayerIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' }],
    result: {
        type: String,
        enum: ['won', 'lost', 'draw', 'tied', 'upcoming', 'cancelled'],
        default: 'upcoming',
    },
    teamScore: { type: String, trim: true },
    opponentScore: { type: String, trim: true },
    winningPrizeMoney: { type: Number, default: 0 },
    momPlayerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' },
    momAwardDetails: { type: String },
    momPrizeMoney: { type: Number, default: 0 },
    notes: { type: String },
}, { timestamps: true });
MatchSchema.index({ tenantId: 1, teamId: 1, matchDate: -1 });
exports.Match = (0, mongoose_1.model)('Match', MatchSchema);
