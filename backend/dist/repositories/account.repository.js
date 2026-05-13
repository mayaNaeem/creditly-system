"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
exports.accountRepository = {
    listByCustomerUser(customerUserId) {
        return prisma_1.prisma.account.findMany({
            where: { customerUserId },
            include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
        });
    },
    listByManager(managerId) {
        return prisma_1.prisma.account.findMany({ where: { managerId } });
    },
    listAll() {
        return prisma_1.prisma.account.findMany();
    },
    listAllWithLatestAuction() {
        return prisma_1.prisma.account.findMany({
            include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
        });
    },
    findById(id) {
        return prisma_1.prisma.account.findUnique({
            where: { id },
            include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
        });
    },
    findByIdScoped(id, user) {
        if (user.role === client_1.Role.ADMIN) {
            return prisma_1.prisma.account.findUnique({
                where: { id },
                include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
            });
        }
        if (user.role === client_1.Role.MANAGER) {
            return prisma_1.prisma.account.findFirst({
                where: { id, managerId: user.id },
                include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
            });
        }
        if (user.role === client_1.Role.USER) {
            return prisma_1.prisma.account.findFirst({
                where: { id, customerUserId: user.id },
                include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
            });
        }
        return prisma_1.prisma.account.findUnique({
            where: { id },
            include: { auctions: { orderBy: { startDate: 'desc' }, take: 1 } },
        });
    },
    update(id, data, db = prisma_1.prisma) {
        return db.account.update({ where: { id }, data });
    },
};
