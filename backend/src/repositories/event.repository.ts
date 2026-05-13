import { EventType, SyncStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

export const eventRepository = {
  create(params: { accountId: string; type: EventType; createdBy: string }) {
    return prisma.event.create({ data: params });
  },
  countLast24h(accountId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return prisma.event.count({ where: { accountId, createdAt: { gte: since } } });
  },
  markSyncResult(id: string, syncStatus: SyncStatus, failureReason?: string) {
    return prisma.event.update({ where: { id }, data: { syncStatus, failureReason } });
  },
  findById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  },
  listByAccount(accountId: string) {
    return prisma.event.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
  },
};
