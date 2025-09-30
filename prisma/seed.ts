import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const workerPassword = await bcrypt.hash('worker123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
      passwordHash: adminPassword,
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: 'worker@example.com' },
    update: {},
    create: {
      email: 'worker@example.com',
      name: 'Worker User',
      role: Role.WORKER,
      passwordHash: workerPassword,
    },
  });

  const workplace = await prisma.workplace.upsert({
    where: { name: 'Downtown Office' },
    update: {
      latitude: 40.748817,
      longitude: -73.985428,
      radiusMeters: 50,
      address: '350 5th Ave, New York, NY 10118',
    },
    create: {
      name: 'Downtown Office',
      latitude: 40.748817,
      longitude: -73.985428,
      radiusMeters: 50,
      address: '350 5th Ave, New York, NY 10118',
    },
  });

  await prisma.assignment.upsert({
    where: {
      userId_workplaceId: {
        userId: worker.id,
        workplaceId: workplace.id,
      },
    },
    update: {},
    create: {
      userId: worker.id,
      workplaceId: workplace.id,
    },
  });

  console.log('Seed data created:', {
    admin: admin.email,
    worker: worker.email,
    workplace: workplace.name,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
