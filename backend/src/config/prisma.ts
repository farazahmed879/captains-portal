import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances of Prisma Client in development
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export const connectPrisma = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma Client connected to MongoDB');
  } catch (error) {
    console.error('❌ Prisma connection error:', error);
  }
};
