"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRepository = void 0;
const prisma_1 = require("../db/prisma");
exports.eventRepository = {
    create(params) {
        return prisma_1.prisma.event.create({ data: params });
    },
    countLast24h(accountId) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return prisma_1.prisma.event.count({ where: { accountId, createdAt: { gte: since } } });
    },
    markSyncResult(id, syncStatus, failureReason) {
        return prisma_1.prisma.event.update({ where: { id }, data: { syncStatus, failureReason } });
    },
    findById(id) {
        return prisma_1.prisma.event.findUnique({ where: { id } });
    },
    listByAccount(accountId) {
        return prisma_1.prisma.event.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
    },
};
