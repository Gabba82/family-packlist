export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  const people = await prisma.person.findMany({ orderBy: { position: 'asc' } });
  return ok(people);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body?.name || '').trim();
  const role = body?.role === 'adult' ? 'adult' : body?.role === 'child' ? 'child' : '';
  const ageLabel = body?.ageLabel ? String(body.ageLabel).trim() : null;

  if (!name) {
    return badRequest('name_required');
  }

  if (!role) {
    return badRequest('role_required');
  }

  const highest = await prisma.person.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });

  const created = await prisma.person.create({
    data: {
      name,
      role,
      ageLabel,
      active: true,
      position: (highest?.position || 0) + 1
    }
  });

  return ok(created, 201);
}
