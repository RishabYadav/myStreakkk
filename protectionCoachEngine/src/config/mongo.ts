import mongoose from 'mongoose';
import { env } from './env';

let mongoConnected = false;

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
    });
    mongoConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error: any) {
    console.warn('⚠️  MongoDB connection failed (AI Chat will be unavailable):', error.message);
    console.warn('   → Whitelist your IP in MongoDB Atlas: Network Access → Add Current IP');
    // Don't exit — server can still run without chat
  }
}

export function isMongoConnected(): boolean {
  return mongoConnected;
}

export default mongoose;
