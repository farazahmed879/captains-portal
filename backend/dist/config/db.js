"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("../models/Tenant");
require("../models/User");
require("../models/Team");
require("../models/Player");
require("../models/Tournament");
require("../models/Match");
require("../models/MatchPayment");
require("../models/Expense");
require("../models/Sponsor");
require("../models/PlayerReturn");
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/captains_portal";
        // Check if placeholder is still present
        if (uri.includes("<db_password>") || uri.includes("<YOUR_PASSWORD>")) {
            console.warn("⚠️ WARNING: MongoDB URI contains a password placeholder (<db_password> or <YOUR_PASSWORD>). Please update your .env file with the actual credentials.");
        }
        await mongoose_1.default.connect(uri);
        console.log("✅ MongoDB connected successfully to database:", mongoose_1.default.connection.name);
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        // Don't exit process in dev so developer can inspect or fix env
    }
};
exports.connectDB = connectDB;
