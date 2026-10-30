"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.__prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = exports.prisma;
}
const connectPrisma = async () => {
    try {
        await exports.prisma.$connect();
        console.log('✅ Prisma Client connected to MongoDB');
    }
    catch (error) {
        console.error('❌ Prisma connection error:', error);
    }
};
exports.connectPrisma = connectPrisma;
