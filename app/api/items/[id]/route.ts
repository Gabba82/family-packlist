export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();

  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  const checked = body?.checked !== undefined ? Boolean(body.checked) : undefined;
  const categoryId = body?.categoryId !== undefined ? (body.categoryId ? String(body.categoryId) : null) : undefined;
  const targetType =
    body?.targetType !== undefined
      ? body.targetType === 'PERSON'
        ? 'PERSON'
        : 'FAMILY'
      : undefined;
  const personId = body?.personId !== undefined ? (body.personId ? String(body.personId) : null) : undefined;

  if (name !== undefined && !name) {
    return badRequest('name_required');
  }

  if (targetType === 'PERSON' && !personId) {
    return badRequest('person_required_for_target_type_person');
  }

  await prisma.packingItem.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(checked !== undefined ? { checked } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(targetType !== undefined ? { targetType } : {}),
      ...(targetType === 'FAMILY' ? { personId: null } : {}),
      ...(targetType === 'PERSON' ? { personId } : {}),
      ...(targetType === undefined && personId !== undefined ? { personId } : {})
    }
  });

  return ok({ updated: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.packingItem.delete({ where: { id: params.id } });
  return ok({ deleted: true });
}
