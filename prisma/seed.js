const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const people = [
    { id: 'family-0', name: 'Toda la familia', role: 'family', ageLabel: null, position: 0 },
    { id: 'adult-1', name: 'Adulto 1', role: 'adult', ageLabel: null, position: 1 },
    { id: 'adult-2', name: 'Adulto 2', role: 'adult', ageLabel: null, position: 2 },
    { id: 'child-3', name: 'Niña 14 años', role: 'child', ageLabel: '14', position: 3 },
    { id: 'child-4', name: 'Niña 8 años', role: 'child', ageLabel: '8', position: 4 },
    { id: 'child-5', name: 'Niña 2 años', role: 'child', ageLabel: '2', position: 5 }
  ];

  const personMap = {};
  for (const person of people) {
    const record = await prisma.person.upsert({
      where: { id: person.id },
      update: {
        name: person.name,
        role: person.role,
        ageLabel: person.ageLabel,
        position: person.position,
        active: true
      },
      create: {
        id: person.id,
        name: person.name,
        role: person.role,
        ageLabel: person.ageLabel,
        position: person.position,
        active: true
      }
    });
    personMap[person.name] = record;
  }

  const categories = [
    { name: 'Ropa', color: '#2563eb', position: 1 },
    { name: 'Medicamentos', color: '#dc2626', position: 2 },
    { name: 'Documentación', color: '#0891b2', position: 3 },
    { name: 'Higiene', color: '#16a34a', position: 4 },
    { name: 'Tecnología', color: '#7c3aed', position: 5 },
    { name: 'Niñas', color: '#ea580c', position: 6 },
    { name: 'Varios', color: '#4b5563', position: 7 }
  ];

  const categoryMap = {};
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      update: {
        color: category.color,
        position: category.position,
        active: true
      },
      create: category
    });
    categoryMap[category.name] = record;
  }

  const baseItems = [
    ['Camisetas', 'Ropa', 'Toda la familia'],
    ['Pantalones', 'Ropa', 'Toda la familia'],
    ['Pijama', 'Ropa', 'Toda la familia'],
    ['Calzado extra', 'Ropa', 'Toda la familia'],
    ['Bañadores', 'Ropa', 'Toda la familia'],
    ['Protector solar', 'Medicamentos', 'Toda la familia'],
    ['Termómetro', 'Medicamentos', 'Toda la familia'],
    ['Medicación habitual', 'Medicamentos', 'Toda la familia'],
    ['Tarjetas sanitarias', 'Documentación', 'Toda la familia'],
    ['DNI/Pasaportes', 'Documentación', 'Toda la familia'],
    ['Reservas y billetes', 'Documentación', 'Toda la familia'],
    ['Cepillos de dientes', 'Higiene', 'Toda la familia'],
    ['Gel/champú', 'Higiene', 'Toda la familia'],
    ['Toallitas', 'Higiene', 'Niña 2 años'],
    ['Cargadores', 'Tecnología', 'Toda la familia'],
    ['Tablet', 'Tecnología', 'Niña 8 años'],
    ['Auriculares', 'Tecnología', 'Niña 14 años'],
    ['Peluches', 'Niñas', 'Niña 2 años'],
    ['Juegos de viaje', 'Niñas', 'Niña 8 años'],
    ['Libro/Kindle', 'Varios', 'Adulto 1'],
    ['Snacks', 'Varios', 'Toda la familia']
  ];

  await prisma.baseItem.deleteMany();
  for (let i = 0; i < baseItems.length; i += 1) {
    const [name, categoryName, personName] = baseItems[i];
    const person = personMap[personName];
    const targetType = personName === 'Toda la familia' ? 'FAMILY' : 'PERSON';
    await prisma.baseItem.create({
      data: {
        name,
        categoryId: categoryMap[categoryName]?.id,
        personId: targetType === 'PERSON' ? person.id : null,
        targetType,
        position: i + 1,
        active: true,
        suggestedOnNewList: true
      }
    });
  }

  const shortTrip = await prisma.template.upsert({
    where: { name: 'Viaje corto' },
    update: { description: '2-3 días', active: true, position: 1 },
    create: { name: 'Viaje corto', description: '2-3 días', active: true, position: 1 }
  });

  const beachTrip = await prisma.template.upsert({
    where: { name: 'Playa' },
    update: { description: 'Viaje de playa', active: true, position: 2 },
    create: { name: 'Playa', description: 'Viaje de playa', active: true, position: 2 }
  });

  await prisma.templateItem.deleteMany();

  const shortItems = [
    ['2 mudas por persona', 'Ropa', 'Toda la familia'],
    ['Neceser básico', 'Higiene', 'Toda la familia'],
    ['Documentos de identidad', 'Documentación', 'Toda la familia'],
    ['Medicación mínima', 'Medicamentos', 'Toda la familia']
  ];

  for (let i = 0; i < shortItems.length; i += 1) {
    const [name, categoryName, personName] = shortItems[i];
    const person = personMap[personName];
    const targetType = personName === 'Toda la familia' ? 'FAMILY' : 'PERSON';
    await prisma.templateItem.create({
      data: {
        templateId: shortTrip.id,
        name,
        categoryId: categoryMap[categoryName]?.id,
        personId: targetType === 'PERSON' ? person.id : null,
        targetType,
        position: i + 1,
        active: true
      }
    });
  }

  const beachItems = [
    ['Bañadores y toallas', 'Ropa', 'Toda la familia'],
    ['Protección solar alta', 'Medicamentos', 'Toda la familia'],
    ['Juguetes de arena', 'Niñas', 'Niña 2 años'],
    ['Gorra/sombrero', 'Ropa', 'Toda la familia']
  ];

  for (let i = 0; i < beachItems.length; i += 1) {
    const [name, categoryName, personName] = beachItems[i];
    const person = personMap[personName];
    const targetType = personName === 'Toda la familia' ? 'FAMILY' : 'PERSON';
    await prisma.templateItem.create({
      data: {
        templateId: beachTrip.id,
        name,
        categoryId: categoryMap[categoryName]?.id,
        personId: targetType === 'PERSON' ? person.id : null,
        targetType,
        position: i + 1,
        active: true
      }
    });
  }

  const existingList = await prisma.packingList.findFirst({ where: { name: 'Escapada de ejemplo' } });
  if (!existingList) {
    const list = await prisma.packingList.create({
      data: { name: 'Escapada de ejemplo', notes: 'Lista inicial para validar funcionamiento' }
    });

    const suggested = await prisma.baseItem.findMany({
      where: { active: true, suggestedOnNewList: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      take: 8
    });

    for (let i = 0; i < suggested.length; i += 1) {
      const item = suggested[i];
      await prisma.packingItem.create({
        data: {
          listId: list.id,
          name: item.name,
          categoryId: item.categoryId,
          targetType: item.targetType,
          personId: item.personId,
          position: i + 1,
          sourceType: 'base_item',
          sourceRefId: item.id
        }
      });
    }
  }

  console.log('Seed completado');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
