export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  return badRequest('method_not_allowed', 405);
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const original = await prisma.packingList.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { position: 'asc' } },
      categories: true
    }
  });

  if (!original) {
    return badRequest('list_not_found', 404);
  }

  const duplicated = await prisma.$transaction(async (tx: any) => {
    const copy = await tx.packingList.create({
      data: {
        name: `${original.name} (copia)`,
        notes: original.notes
      }
    });

    for (const item of original.items) {
      await tx.packingItem.create({
        data: {
          listId: copy.id,
          name: item.name,
          checked: false,
          position: item.position,
          categoryId: item.categoryId,
          personId: item.personId,
          targetType: item.targetType,
          sourceType: item.sourceType,
          sourceRefId: item.sourceRefId
        }
      });
    }

    for (const categoryState of original.categories) {
      await tx.listCategoryState.create({
        data: {
          listId: copy.id,
          categoryId: categoryState.categoryId,
          collapsed: categoryState.collapsed
        }
      });
    }

    return copy;
  });

  return ok({ id: duplicated.id }, 201);
}
