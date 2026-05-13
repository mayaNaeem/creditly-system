import { Prisma, Role } from '@prisma/client';
import { prisma } from '../db/prisma';

type UserCtx = { id: string; role: Role; bankId: string | null };
type DbClient = Prisma.TransactionClient;

export const accountRepository = {
  listByCustomerUser(customerUserId: string) {
    return prisma.account.findMany({
      where: { customerUserId },
      include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
  },
  listByManager(managerId: string) {
    return prisma.account.findMany({ where: { managerId } });
  },
  listAll() {
    return prisma.account.findMany();
  },
  listAllWithLatestAuction() {
    return prisma.account.findMany({
      include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
  },
  findById(id: string) {
    return prisma.account.findUnique({
      where: { id },
      include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
  },
  findByIdScoped(id: string, user: UserCtx) {
    if (user.role === Role.ADMIN) {
      return prisma.account.findUnique({
        where: { id },
        include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
      });
    }
    if (user.role === Role.MANAGER) {
      return prisma.account.findFirst({
        where: { id, managerId: user.id },
        include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
      });
    }
    if (user.role === Role.USER) {
      return prisma.account.findFirst({
        where: { id, customerUserId: user.id },
        include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
      });
    }
    return prisma.account.findUnique({
      where: { id },
      include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
  },
  update(id: string, data: Parameters<typeof prisma.account.update>[0]['data'], db: DbClient = prisma) {
    return db.account.update({ where: { id }, data });
  },
};
