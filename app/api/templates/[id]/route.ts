export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  const description = body?.description !== undefined ? String(body.description || '').trim() : undefined;
  const active = body?.active !== undefined ? Boolean(body.active) : undefined;

  if (name !== undefined && !name) {
    return badRequest('name_required');
  }

  const updated = await prisma.template.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(active !== undefined ? { active } : {})
    }
  });

  return ok(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const updated = await prisma.template.update({ where: { id: params.id }, data: { active: false } });
  return ok(updated);
}
