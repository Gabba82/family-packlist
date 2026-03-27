export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  return badRequest('method_not_allowed', 405);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const name = String(body?.name || '').trim();
  const categoryId = body?.categoryId ? String(body.categoryId) : null;
  const targetType = body?.targetType === 'PERSON' ? 'PERSON' : 'FAMILY';
  const personId = body?.personId ? String(body.personId) : null;

  if (!name) {
    return badRequest('name_required');
  }

  if (targetType === 'PERSON' && !personId) {
    return badRequest('person_required_for_target_type_person');
  }

  const highest = await prisma.packingItem.findFirst({
    where: { listId: params.id },
    orderBy: { position: 'desc' },
    select: { position: true }
  });

  const item = await prisma.packingItem.create({
    data: {
      listId: params.id,
      name,
      checked: false,
      categoryId,
      targetType,
      personId: targetType === 'PERSON' ? personId : null,
      position: (highest?.position || 0) + 1,
      sourceType: 'manual'
    }
  });

  return ok({ id: item.id }, 201);
}
