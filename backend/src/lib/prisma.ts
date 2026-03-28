import { getPrisma, setPrisma, resetPrisma } from './prisma-client';

// Re-export factory functions for tests
export { getPrisma, setPrisma, resetPrisma };

// Default export — calls getPrisma() at access time so setPrisma() takes effect
const prismaClient = getPrisma();
export default prismaClient;
export { prismaClient as prisma };
