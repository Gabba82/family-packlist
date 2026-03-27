export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  const active = body?.active !== undefined ? Boolean(body.active) : undefined;
  const role =
    body?.role !== undefined
      ? body.role === 'adult'
        ? 'adult'
        : body.role === 'child'
          ? 'child'
          : undefined
      : undefined;
  const ageLabel = body?.ageLabel !== undefined ? String(body.ageLabel || '').trim() : undefined;

  if (name !== undefined && !name) {
    return badRequest('name_required');
  }

  if (body?.role !== undefined && !role) {
    return badRequest('invalid_role');
  }

  if (params.id === 'family-0' && role !== undefined) {
    return badRequest('family_role_not_editable');
  }

  const updated = await prisma.person.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(ageLabel !== undefined ? { ageLabel: ageLabel || null } : {})
    }
  });

  return ok(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (params.id === 'family-0') {
    return badRequest('family_person_not_deletable');
  }
  const updated = await prisma.person.update({
    where: { id: params.id },
    data: { active: false }
  });
  return ok(updated);
}
