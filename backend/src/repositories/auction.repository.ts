import { AuctionStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../db/prisma';

type DbClient = Prisma.TransactionClient;
type UserCtx = { id: string; role: Role; bankId: string | null };

export const auctionRepository = {
  create(accountId: string, startDate: Date, endDate: Date, db: DbClient = prisma) {
    return db.auction.create({ data: { accountId, startDate, endDate, status: AuctionStatus.OPEN } });
  },
  findById(id: string, db: DbClient = prisma) {
    return db.auction.findUnique({ where: { id }, include: { offers: true } });
  },
  findByIdScopedForClose(id: string, user: UserCtx, db: DbClient = prisma) {
    if (user.role === Role.ADMIN) {
      return db.auction.findUnique({ where: { id }, include: { offers: true } });
    }
    if (user.role === Role.MANAGER) {
      return db.auction.findFirst({
        where: { id, account: { managerId: user.id } },
        include: { offers: true },
      });
    }
    return null;
  },
  findByIdScopedForBanker(id: string, bankId: string, db: DbClient = prisma) {
    return db.auction.findFirst({
      where: {
        id,
        offers: { none: { bankId } },
      },
      include: { offers: true },
    });
  },
  listOpenForBanker(bankId: string) {
    return prisma.auction.findMany({
      where: { status: AuctionStatus.OPEN, offers: { none: { bankId } } },
      include: { account: true },
    });
  },
  expireOverdueOpenAuctions(now: Date, db: DbClient = prisma) {
    return db.auction.updateMany({
      where: { status: AuctionStatus.OPEN, endDate: { lte: now } },
      data: { status: AuctionStatus.EXPIRED },
    });
  },
  updateStatus(id: string, status: AuctionStatus, winnerOfferId?: string, db: DbClient = prisma) {
    return db.auction.update({ where: { id }, data: { status, winnerOfferId } });
  },
  createOffer(auctionId: string, bankId: string, interestRate: number, db: DbClient = prisma) {
    return db.offer.create({ data: { auctionId, bankId, interestRate } });
  },
  markWinner(offerId: string, db: DbClient = prisma) {
    return db.offer.update({ where: { id: offerId }, data: { isWinner: true } });
  },
};
