"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const mongoose_1 = require("mongoose");
const PlayerSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    teamIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' }],
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: {
        type: String,
        enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
        default: 'all_rounder',
    },
    battingStyle: {
        type: String,
        enum: ['right_hand', 'left_hand'],
        default: 'right_hand',
    },
    bowlingStyle: {
        type: String,
        enum: ['right_arm_fast', 'right_arm_medium', 'right_arm_spin', 'left_arm_fast', 'left_arm_spin', 'none'],
        default: 'right_arm_medium',
    },
    jerseyNumber: { type: Number },
    profilePhoto: { type: String },
    isRegular: { type: Boolean, default: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
PlayerSchema.index({ tenantId: 1, name: 1 });
exports.Player = (0, mongoose_1.model)('Player', PlayerSchema);
