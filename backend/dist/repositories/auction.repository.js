"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
exports.auctionRepository = {
    create(accountId, startDate, endDate, db = prisma_1.prisma) {
        return db.auction.create({ data: { accountId, startDate, endDate, status: client_1.AuctionStatus.OPEN } });
    },
    findById(id, db = prisma_1.prisma) {
        return db.auction.findUnique({ where: { id }, include: { offers: true } });
    },
    findByIdScopedForClose(id, user, db = prisma_1.prisma) {
        if (user.role === client_1.Role.ADMIN) {
            return db.auction.findUnique({ where: { id }, include: { offers: true } });
        }
        if (user.role === client_1.Role.MANAGER) {
            return db.auction.findFirst({
                where: { id, account: { managerId: user.id } },
                include: { offers: true },
            });
        }
        return null;
    },
    findByIdScopedForBanker(id, bankId, db = prisma_1.prisma) {
        return db.auction.findFirst({
            where: {
                id,
                offers: { none: { bankId } },
            },
            include: { offers: true },
        });
    },
    listOpenForBanker(bankId) {
        return prisma_1.prisma.auction.findMany({
            where: { status: client_1.AuctionStatus.OPEN, offers: { none: { bankId } } },
            include: { account: true },
        });
    },
    expireOverdueOpenAuctions(now, db = prisma_1.prisma) {
        return db.auction.updateMany({
            where: { status: client_1.AuctionStatus.OPEN, endDate: { lte: now } },
            data: { status: client_1.AuctionStatus.EXPIRED },
        });
    },
    updateStatus(id, status, winnerOfferId, db = prisma_1.prisma) {
        return db.auction.update({ where: { id }, data: { status, winnerOfferId } });
    },
    createOffer(auctionId, bankId, interestRate, db = prisma_1.prisma) {
        return db.offer.create({ data: { auctionId, bankId, interestRate } });
    },
    markWinner(offerId, db = prisma_1.prisma) {
        return db.offer.update({ where: { id: offerId }, data: { isWinner: true } });
    },
};
