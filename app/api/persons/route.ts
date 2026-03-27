export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { ok } from '@/app/lib/http';

export async function GET() {
  const people = await prisma.person.findMany({ orderBy: { position: 'asc' } });
  return ok(people);
}
