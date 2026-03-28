import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export function setPrisma(client: PrismaClient): void {
  prismaInstance = client;
}

export function resetPrisma(): void {
  prismaInstance = null;
}
