export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  const active = body?.active !== undefined ? Boolean(body.active) : undefined;

  if (name !== undefined && !name) {
    return badRequest('name_required');
  }

  const updated = await prisma.person.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(active !== undefined ? { active } : {})
    }
  });

  return ok(updated);
}
