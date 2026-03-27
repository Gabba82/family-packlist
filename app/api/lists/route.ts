export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';
import { listProgress } from '@/app/lib/serializers';

export async function GET() {
  const lists = await prisma.packingList.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      items: { where: { checked: true }, select: { id: true } }
    }
  });

  return ok(
    lists.map((list: any) => ({
      id: list.id,
      name: list.name,
      notes: list.notes,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      progress: listProgress(list._count.items, list.items.length)
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body?.name || '').trim();
  const notes = body?.notes ? String(body.notes).trim() : null;
  const templateId = body?.templateId ? String(body.templateId) : null;

  if (!name) {
    return badRequest('name_required');
  }

  const list = await prisma.$transaction(async (tx: any) => {
    const created = await tx.packingList.create({ data: { name, notes } });

    const baseItems = await tx.baseItem.findMany({
      where: {
        active: true,
        suggestedOnNewList: true,
        OR: [{ categoryId: null }, { category: { active: true } }]
      },
      include: { category: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
    });

    const templateItems = templateId
      ? await tx.templateItem.findMany({
          where: {
            templateId,
            active: true,
            OR: [{ categoryId: null }, { category: { active: true } }]
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
        })
      : [];

    let position = 1;

    for (const item of baseItems) {
      await tx.packingItem.create({
        data: {
          listId: created.id,
          name: item.name,
          checked: false,
          position,
          categoryId: item.categoryId,
          targetType: item.targetType,
          personId: item.targetType === 'PERSON' ? item.personId : null,
          sourceType: 'base_item',
          sourceRefId: item.id
        }
      });
      position += 1;
    }

    for (const item of templateItems) {
      await tx.packingItem.create({
        data: {
          listId: created.id,
          name: item.name,
          checked: false,
          position,
          categoryId: item.categoryId,
          targetType: item.targetType,
          personId: item.targetType === 'PERSON' ? item.personId : null,
          sourceType: 'template',
          sourceRefId: item.id
        }
      });
      position += 1;
    }

    return created;
  });

  return ok({ id: list.id }, 201);
}
