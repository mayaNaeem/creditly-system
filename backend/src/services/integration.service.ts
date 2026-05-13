import { SyncStatus } from '@prisma/client';
import { CrmIntegration } from '../integrations/crm.integration';
import { eventRepository } from '../repositories/event.repository';

const crm = new CrmIntegration();

export const integrationService = {
  async syncEvent(eventId: string, type: string, accountId: string, simulateFailure = false) {
    const current = await eventRepository.findById(eventId);
    if (current?.syncStatus === SyncStatus.SUCCESS) {
      return;
    }

    try {
      await crm.sendEvent({
        type,
        accountId,
        meta: {
          simulateFailure,
          idempotencyKey: eventId,
        },
      });
      await eventRepository.markSyncResult(eventId, SyncStatus.SUCCESS);
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : 'Unknown CRM failure';
      await eventRepository.markSyncResult(eventId, SyncStatus.FAILED, failureReason);
    }
  },
};
