import { AuctionStatus, EventType, Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { ApiError } from '../errors/api-error';
import { accountRepository } from '../repositories/account.repository';
import { auctionRepository } from '../repositories/auction.repository';
import { eventRepository } from '../repositories/event.repository';
import { utcNow, utcPlusMs } from '../utils/time';
import { integrationService } from './integration.service';

type UserCtx = { id: string; role: Role; bankId: string | null };

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const selectWinner = <T extends { id: string; interestRate: number; createdAt: Date }>(offers: T[]) => {
  if (offers.length === 0) return null;
  return offers.reduce((best, current) => {
    if (current.interestRate < best.interestRate) return current;
    if (current.interestRate === best.interestRate && current.createdAt < best.createdAt) return current;
    return best;
  });
};

export const auctionService = {
  async openAuction(user: UserCtx, accountId: string) {
    if (user.role !== Role.MANAGER && user.role !== Role.ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Role cannot open auctions');
    }
    const account = await accountRepository.findByIdScoped(accountId, user);
    if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
    const startDate = utcNow();
    const endDate = utcPlusMs(startDate, THREE_DAYS_MS);
    const auction = await auctionRepository.create(accountId, startDate, endDate);
    const event = await eventRepository.create({ accountId, type: EventType.auction_opened, createdBy: user.id });
    await integrationService.syncEvent(event.id, EventType.auction_opened, accountId);
    return auction;
  },

  async submitOffer(user: UserCtx, auctionId: string, interestRate: number) {
    if (user.role !== Role.BANKER || !user.bankId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only bankers can submit offers');
    }
    return prisma.$transaction(async (tx) => {
      const auction = await auctionRepository.findByIdScopedForBanker(auctionId, user.bankId!, tx);
      if (!auction) {
        throw new ApiError(404, 'NOT_FOUND', 'Auction not found');
      }
      if (auction.status === AuctionStatus.OPEN && auction.endDate <= utcNow()) {
        await auctionRepository.updateStatus(auction.id, AuctionStatus.EXPIRED, undefined, tx);
        throw new ApiError(400, 'AUCTION_EXPIRED', 'Auction is no longer open');
      }
      if (auction.status !== AuctionStatus.OPEN) {
        throw new ApiError(400, 'AUCTION_EXPIRED', 'Auction is no longer open');
      }
      return auctionRepository.createOffer(auction.id, user.bankId!, interestRate, tx);
    });
  },

  async closeAuction(user: UserCtx, auctionId: string) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ApiError(403, 'FORBIDDEN', 'Role cannot close auction');
    }
    const result = await prisma.$transaction(async (tx) => {
      const auction = await auctionRepository.findByIdScopedForClose(auctionId, user, tx);
      if (!auction) throw new ApiError(404, 'NOT_FOUND', 'Auction not found');
      if (auction.status === AuctionStatus.OPEN && auction.endDate <= utcNow()) {
        await auctionRepository.updateStatus(auction.id, AuctionStatus.EXPIRED, undefined, tx);
      }
      const refreshedAuction = await auctionRepository.findByIdScopedForClose(auctionId, user, tx);
      if (!refreshedAuction) throw new ApiError(404, 'NOT_FOUND', 'Auction not found');
      if (refreshedAuction.status !== AuctionStatus.OPEN) {
        return { auction: refreshedAuction, winner: null as null };
      }

      const winner = selectWinner(refreshedAuction.offers);
      if (!winner) {
        const expired = await auctionRepository.updateStatus(refreshedAuction.id, AuctionStatus.EXPIRED, undefined, tx);
        return { auction: expired, winner: null as null | typeof winner };
      }

      await auctionRepository.markWinner(winner.id, tx);
      const closed = await auctionRepository.updateStatus(refreshedAuction.id, AuctionStatus.CLOSED, winner.id, tx);
      await accountRepository.update(refreshedAuction.accountId, { status: 'WON' }, tx);
      return { auction: closed, winner, accountId: refreshedAuction.accountId };
    });

    if (!result.winner) {
      return { auction: result.auction, winner: null };
    }

    const event = await eventRepository.create({
      accountId: result.accountId,
      type: EventType.winning_offer_selected,
      createdBy: user.id,
    });
    await integrationService.syncEvent(event.id, EventType.winning_offer_selected, result.accountId);

    return { auction: result.auction, winner: result.winner };
  },

  async listOpenAuctionsForBanker(user: UserCtx) {
    if (user.role !== Role.BANKER || !user.bankId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only bankers can query auctions');
    }
    await auctionRepository.expireOverdueOpenAuctions(utcNow());
    return auctionRepository.listOpenForBanker(user.bankId);
  },
};
