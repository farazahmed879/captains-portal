import mongoose from "mongoose";
import "../models/Tenant";
import "../models/User";
import "../models/Team";
import "../models/Player";
import "../models/Tournament";
import "../models/Match";
import "../models/MatchPayment";
import "../models/Expense";
import "../models/Sponsor";
import "../models/PlayerReturn";

export const connectDB = async (): Promise<void> => {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/captains_portal";

    // Check if placeholder is still present
    if (uri.includes("<db_password>") || uri.includes("<YOUR_PASSWORD>")) {
      console.warn(
        "⚠️ WARNING: MongoDB URI contains a password placeholder (<db_password> or <YOUR_PASSWORD>). Please update your .env file with the actual credentials.",
      );
    }

    await mongoose.connect(uri);
    console.log(
      "✅ MongoDB connected successfully to database:",
      mongoose.connection.name,
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    // Don't exit process in dev so developer can inspect or fix env
  }
};
