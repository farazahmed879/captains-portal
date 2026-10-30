"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const mongoose_1 = require("mongoose");
const TenantSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.Tenant = (0, mongoose_1.model)('Tenant', TenantSchema);
