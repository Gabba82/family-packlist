export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { ok, badRequest } from '@/app/lib/http';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: 'ok' });
  } catch (error) {
    console.error(error);
    return badRequest('database_unreachable', 503);
  }
}
