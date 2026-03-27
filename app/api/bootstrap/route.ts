export const dynamic = 'force-dynamic';

import { prisma } from '@/app/lib/prisma';
import { ok } from '@/app/lib/http';

export async function GET() {
  const [persons, activeCategories, templates] = await Promise.all([
    prisma.person.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
    prisma.template.findMany({ where: { active: true }, orderBy: { position: 'asc' } })
  ]);

  return ok({ persons, activeCategories, templates });
}
