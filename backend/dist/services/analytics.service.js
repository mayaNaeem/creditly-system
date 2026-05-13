"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const api_error_1 = require("../errors/api-error");
exports.analyticsService = {
    async summary(user) {
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.MANAGER) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Role cannot access analytics');
        }
        const [accounts, auctionsOpen, auctionsClosed, offers] = await Promise.all([
            prisma_1.prisma.account.count(),
            prisma_1.prisma.auction.count({ where: { status: 'OPEN' } }),
            prisma_1.prisma.auction.count({ where: { status: 'CLOSED' } }),
            prisma_1.prisma.offer.count(),
        ]);
        return { accounts, auctionsOpen, auctionsClosed, offers };
    },
};
