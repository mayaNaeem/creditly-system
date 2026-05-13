import { Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { ApiError } from '../errors/api-error';

type UserCtx = { id: string; role: Role; bankId: string | null };

export const analyticsService = {
  async summary(user: UserCtx) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ApiError(403, 'FORBIDDEN', 'Role cannot access analytics');
    }
    const [accounts, auctionsOpen, auctionsClosed, offers] = await Promise.all([
      prisma.account.count(),
      prisma.auction.count({ where: { status: 'OPEN' } }),
      prisma.auction.count({ where: { status: 'CLOSED' } }),
      prisma.offer.count(),
    ]);
    return { accounts, auctionsOpen, auctionsClosed, offers };
  },
};
