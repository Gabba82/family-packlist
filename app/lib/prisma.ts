import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
