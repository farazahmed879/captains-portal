"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    playerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' },
    role: {
        type: String,
        enum: ['super_admin', 'captain', 'treasurer', 'viewer'],
        default: 'captain',
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    dashboardSettings: {
        widgets: { type: [String], default: [] },
        selections: {
            playerId: { type: String, default: 'all' },
            tournamentId: { type: String, default: 'all' },
            teamId: { type: String, default: 'all' },
            sponsorId: { type: String, default: 'all' },
        },
    },
}, { timestamps: true });
// Unique email per tenant
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = (0, mongoose_1.model)('User', UserSchema);
