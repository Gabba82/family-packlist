export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();

  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  const categoryId = body?.categoryId !== undefined ? (body.categoryId ? String(body.categoryId) : null) : undefined;
  const targetType =
    body?.targetType !== undefined
      ? body.targetType === 'PERSON'
        ? 'PERSON'
        : 'FAMILY'
      : undefined;
  const personId = body?.personId !== undefined ? (body.personId ? String(body.personId) : null) : undefined;
  const active = body?.active !== undefined ? Boolean(body.active) : undefined;

  if (name !== undefined && !name) {
    return badRequest('name_required');
  }

  if (targetType === 'PERSON' && !personId) {
    return badRequest('person_required_for_target_type_person');
  }

  const updated = await prisma.templateItem.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(targetType !== undefined ? { targetType } : {}),
      ...(targetType === 'FAMILY' ? { personId: null } : {}),
      ...(targetType === 'PERSON' ? { personId } : {}),
      ...(targetType === undefined && personId !== undefined ? { personId } : {}),
      ...(active !== undefined ? { active } : {})
    }
  });

  return ok(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const updated = await prisma.templateItem.update({ where: { id: params.id }, data: { active: false } });
  return ok(updated);
}
