"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const api_error_1 = require("../errors/api-error");
const account_repository_1 = require("../repositories/account.repository");
const auction_repository_1 = require("../repositories/auction.repository");
const event_repository_1 = require("../repositories/event.repository");
const time_1 = require("../utils/time");
const integration_service_1 = require("./integration.service");
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const selectWinner = (offers) => {
    if (offers.length === 0)
        return null;
    return offers.reduce((best, current) => (current.interestRate < best.interestRate ? current : best));
};
exports.auctionService = {
    async openAuction(user, accountId) {
        if (user.role !== client_1.Role.MANAGER && user.role !== client_1.Role.ADMIN) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Role cannot open auctions');
        }
        const account = await account_repository_1.accountRepository.findByIdScoped(accountId, user);
        if (!account)
            throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
        const startDate = (0, time_1.utcNow)();
        const endDate = (0, time_1.utcPlusMs)(startDate, THREE_DAYS_MS);
        const auction = await auction_repository_1.auctionRepository.create(accountId, startDate, endDate);
        const event = await event_repository_1.eventRepository.create({ accountId, type: client_1.EventType.auction_opened, createdBy: user.id });
        await integration_service_1.integrationService.syncEvent(event.id, client_1.EventType.auction_opened, accountId);
        return auction;
    },
    async submitOffer(user, auctionId, interestRate) {
        if (user.role !== client_1.Role.BANKER || !user.bankId) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Only bankers can submit offers');
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const auction = await auction_repository_1.auctionRepository.findByIdScopedForBanker(auctionId, user.bankId, tx);
            if (!auction) {
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Auction not found');
            }
            if (auction.status === client_1.AuctionStatus.OPEN && auction.endDate <= (0, time_1.utcNow)()) {
                await auction_repository_1.auctionRepository.updateStatus(auction.id, client_1.AuctionStatus.EXPIRED, undefined, tx);
                throw new api_error_1.ApiError(400, 'AUCTION_EXPIRED', 'Auction is no longer open');
            }
            if (auction.status !== client_1.AuctionStatus.OPEN) {
                throw new api_error_1.ApiError(400, 'AUCTION_EXPIRED', 'Auction is no longer open');
            }
            return auction_repository_1.auctionRepository.createOffer(auction.id, user.bankId, interestRate, tx);
        });
    },
    async closeAuction(user, auctionId) {
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.MANAGER) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Role cannot close auction');
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const auction = await auction_repository_1.auctionRepository.findByIdScopedForClose(auctionId, user, tx);
            if (!auction)
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Auction not found');
            if (auction.status === client_1.AuctionStatus.OPEN && auction.endDate <= (0, time_1.utcNow)()) {
                await auction_repository_1.auctionRepository.updateStatus(auction.id, client_1.AuctionStatus.EXPIRED, undefined, tx);
            }
            const refreshedAuction = await auction_repository_1.auctionRepository.findByIdScopedForClose(auctionId, user, tx);
            if (!refreshedAuction)
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Auction not found');
            if (refreshedAuction.status !== client_1.AuctionStatus.OPEN) {
                return { auction: refreshedAuction, winner: null };
            }
            const winner = selectWinner(refreshedAuction.offers);
            if (!winner) {
                const expired = await auction_repository_1.auctionRepository.updateStatus(refreshedAuction.id, client_1.AuctionStatus.EXPIRED, undefined, tx);
                return { auction: expired, winner: null };
            }
            await auction_repository_1.auctionRepository.markWinner(winner.id, tx);
            const closed = await auction_repository_1.auctionRepository.updateStatus(refreshedAuction.id, client_1.AuctionStatus.CLOSED, winner.id, tx);
            await account_repository_1.accountRepository.update(refreshedAuction.accountId, { status: 'WON' }, tx);
            return { auction: closed, winner, accountId: refreshedAuction.accountId };
        });
        if (!result.winner) {
            return { auction: result.auction, winner: null };
        }
        const event = await event_repository_1.eventRepository.create({
            accountId: result.accountId,
            type: client_1.EventType.winning_offer_selected,
            createdBy: user.id,
        });
        await integration_service_1.integrationService.syncEvent(event.id, client_1.EventType.winning_offer_selected, result.accountId);
        return { auction: result.auction, winner: result.winner };
    },
    async listOpenAuctionsForBanker(user) {
        if (user.role !== client_1.Role.BANKER || !user.bankId) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Only bankers can query auctions');
        }
        await auction_repository_1.auctionRepository.expireOverdueOpenAuctions((0, time_1.utcNow)());
        return auction_repository_1.auctionRepository.listOpenForBanker(user.bankId);
    },
};
