export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { badRequest, ok } from '@/app/lib/http';

export async function GET() {
  return badRequest('method_not_allowed', 405);
}

export async function POST(request: Request, { params }: { params: { id: string; categoryId: string } }) {
  const body = await request.json();
  const collapsed = Boolean(body?.collapsed);

  await prisma.listCategoryState.upsert({
    where: {
      listId_categoryId: {
        listId: params.id,
        categoryId: params.categoryId
      }
    },
    update: { collapsed },
    create: {
      listId: params.id,
      categoryId: params.categoryId,
      collapsed
    }
  });

  return ok({ collapsed });
}
