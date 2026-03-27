export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  const templates = await prisma.template.findMany({
    include: {
      items: {
        include: { category: true, person: true },
        orderBy: { position: 'asc' }
      }
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
  });

  return ok(templates);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body?.name || '').trim();
  const description = body?.description ? String(body.description).trim() : null;

  if (!name) {
    return badRequest('name_required');
  }

  const highest = await prisma.template.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });

  const created = await prisma.template.create({
    data: {
      name,
      description,
      active: true,
      position: (highest?.position || 0) + 1
    }
  });

  return ok(created, 201);
}
