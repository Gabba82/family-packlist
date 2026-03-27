export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  return badRequest('method_not_allowed', 405);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds.map(String) : null;

  if (!orderedIds || orderedIds.length === 0) {
    return badRequest('ordered_ids_required');
  }

  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.packingItem.updateMany({
        where: { id, listId: params.id },
        data: { position: index + 1 }
      })
    )
  );

  return ok({ reordered: true });
}
