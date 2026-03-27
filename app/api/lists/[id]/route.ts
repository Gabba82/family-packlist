export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';
import { itemAssigneeLabel, listProgress } from '@/app/lib/serializers';

function groupByCategory(list: any) {
  const activeCategories = list.items
    .map((item: any) => item.category)
    .filter(Boolean)
    .reduce((acc: any, category: any) => {
      acc.set(category.id, category);
      return acc;
    }, new Map());

  const categoryStates = new Map(list.categories.map((state: any) => [state.categoryId, state.collapsed]));

  const grouped = new Map();

  for (const item of list.items) {
    const key = item.categoryId || 'uncategorized';
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: item.categoryId,
        name: item.category?.name || 'Sin categoría',
        color: item.category?.color || '#6b7280',
        active: item.category?.active ?? true,
        collapsed: item.categoryId ? categoryStates.get(item.categoryId) || false : false,
        items: []
      });
    }

    grouped.get(key).items.push({
      id: item.id,
      name: item.name,
      checked: item.checked,
      position: item.position,
      categoryId: item.categoryId,
      personId: item.personId,
      targetType: item.targetType,
      assigneeLabel: itemAssigneeLabel(item.targetType, item.person?.name),
      personName: item.person?.name || null
    });
  }

  for (const category of list.allCategories) {
    if (!grouped.has(category.id)) {
      grouped.set(category.id, {
        id: category.id,
        name: category.name,
        color: category.color || '#6b7280',
        active: category.active,
        collapsed: categoryStates.get(category.id) || false,
        items: []
      });
    }
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    const aCategory = activeCategories.get(a.id);
    const bCategory = activeCategories.get(b.id);
    const aPos = aCategory?.position ?? 9999;
    const bPos = bCategory?.position ?? 9999;
    return aPos - bPos;
  });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const list = await prisma.packingList.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: { category: true, person: true },
        orderBy: { position: 'asc' }
      },
      categories: true
    }
  });

  if (!list) {
    return badRequest('list_not_found', 404);
  }

  const allCategories = await prisma.category.findMany({ orderBy: { position: 'asc' } });

  const completed = list.items.filter((item: any) => item.checked).length;

  return ok({
    id: list.id,
    name: list.name,
    notes: list.notes,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    progress: listProgress(list.items.length, completed),
    categoryGroups: groupByCategory({ ...list, allCategories }),
    people: await prisma.person.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
    categories: allCategories,
    baseItems: await prisma.baseItem.findMany({
      where: { active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
    })
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const name = body?.name ? String(body.name).trim() : undefined;
  const notes = body?.notes !== undefined ? String(body.notes || '').trim() : undefined;

  if (name !== undefined && !name) {
    return badRequest('name_required');
  }

  const updated = await prisma.packingList.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(notes !== undefined ? { notes } : {})
    }
  });

  return ok({ id: updated.id });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.packingList.delete({ where: { id: params.id } });
  return ok({ deleted: true });
}
