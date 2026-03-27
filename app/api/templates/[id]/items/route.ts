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

  const highest = await prisma.templateItem.findFirst({
    where: { templateId: params.id },
    orderBy: { position: 'desc' },
    select: { position: true }
  });

  const created = await prisma.templateItem.create({
    data: {
      templateId: params.id,
      name,
      categoryId,
      targetType,
      personId: targetType === 'PERSON' ? personId : null,
      active: true,
      position: (highest?.position || 0) + 1
    }
  });

  return ok(created, 201);
}
