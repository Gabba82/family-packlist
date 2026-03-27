export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { position: 'asc' } });
  return ok(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body?.name || '').trim();
  const color = body?.color ? String(body.color).trim() : null;

  if (!name) {
    return badRequest('name_required');
  }

  const highest = await prisma.category.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });

  const created = await prisma.category.create({
    data: {
      name,
      color,
      position: (highest?.position || 0) + 1,
      active: true
    }
  });

  return ok(created, 201);
}
