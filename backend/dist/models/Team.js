"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
const mongoose_1 = require("mongoose");
const TeamSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    captainId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, uppercase: true, trim: true },
    teamType: { type: String, default: 'my_team' },
    phone: { type: String, trim: true },
    city: { type: String, default: 'Karachi' },
    logo: { type: String },
    primaryColor: { type: String, default: '#0284c7' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
TeamSchema.index({ tenantId: 1, name: 1 }, { unique: true });
exports.Team = (0, mongoose_1.model)('Team', TeamSchema);
