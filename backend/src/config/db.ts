import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/captains_portal';
    
    // Check if placeholder is still present
    if (uri.includes('<db_password>') || uri.includes('<YOUR_PASSWORD>')) {
      console.warn('⚠️ WARNING: MongoDB URI contains a password placeholder (<db_password> or <YOUR_PASSWORD>). Please update your .env file with the actual credentials.');
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully to database:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit process in dev so developer can inspect or fix env
  }
};
