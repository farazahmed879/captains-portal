"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tournament = void 0;
const mongoose_1 = require("mongoose");
const TournamentSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    name: { type: String, required: true, trim: true },
    organizer: { type: String, trim: true },
    venue: { type: String, trim: true },
    format: {
        type: String,
        enum: ['T20', 'Tape Ball', 'Hard Ball', 'T10', '100 Balls', 'Other'],
        default: 'T20',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    entryFee: { type: Number, default: 0 },
    expectedWinningPrize: { type: Number, default: 0 },
    actualWinningPrizeWon: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'knocked_out', 'champions'],
        default: 'ongoing',
    },
    notes: { type: String },
}, { timestamps: true });
TournamentSchema.index({ tenantId: 1, teamId: 1, name: 1 });
exports.Tournament = (0, mongoose_1.model)('Tournament', TournamentSchema);
