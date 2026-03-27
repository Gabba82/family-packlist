export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  const items = await prisma.baseItem.findMany({
    include: { category: true, person: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
  });
  return ok(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body?.name || '').trim();
  const categoryId = body?.categoryId ? String(body.categoryId) : null;
  const targetType = body?.targetType === 'PERSON' ? 'PERSON' : 'FAMILY';
  const personId = body?.personId ? String(body.personId) : null;
  const suggestedOnNewList = body?.suggestedOnNewList !== undefined ? Boolean(body.suggestedOnNewList) : true;

  if (!name) {
    return badRequest('name_required');
  }

  if (targetType === 'PERSON' && !personId) {
    return badRequest('person_required_for_target_type_person');
  }

  const highest = await prisma.baseItem.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });

  const created = await prisma.baseItem.create({
    data: {
      name,
      categoryId,
      targetType,
      personId: targetType === 'PERSON' ? personId : null,
      active: true,
      suggestedOnNewList,
      position: (highest?.position || 0) + 1
    }
  });

  return ok(created, 201);
}
