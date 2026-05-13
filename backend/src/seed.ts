import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from './db/prisma';

const PASSWORD = 'Creditly123!';

async function main() {
  await prisma.offer.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@creditly.demo', passwordHash, role: Role.ADMIN },
  });
  const manager = await prisma.user.create({
    data: { email: 'manager@creditly.demo', passwordHash, role: Role.MANAGER },
  });
  const banker = await prisma.user.create({
    data: { email: 'banker@creditly.demo', passwordHash, role: Role.BANKER, bankId: 'bank-demo-a' },
  });
  const bankerB = await prisma.user.create({
    data: { email: 'banker-b@creditly.demo', passwordHash, role: Role.BANKER, bankId: 'bank-demo-b' },
  });
  const customer = await prisma.user.create({
    data: { email: 'customer@creditly.demo', passwordHash, role: Role.USER },
  });

  await prisma.account.create({
    data: {
      customerName: 'Acme Corp',
      email: 'billing@acme.example',
      phone: '+1-555-0100',
      status: 'ACTIVE',
      managerId: manager.id,
    },
  });

  await prisma.account.create({
    data: {
      customerName: 'Jane Customer',
      email: 'jane@example.com',
      phone: '+1-555-0200',
      status: 'PENDING',
      managerId: manager.id,
      customerUserId: customer.id,
    },
  });

  console.log('Seed complete. Demo password for all users:', PASSWORD);
  console.log('Users:', {
    admin: admin.email,
    manager: manager.email,
    banker: banker.email,
    bankerB: bankerB.email,
    customer: customer.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
