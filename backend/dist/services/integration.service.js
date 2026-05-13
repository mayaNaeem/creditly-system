"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationService = void 0;
const client_1 = require("@prisma/client");
const crm_integration_1 = require("../integrations/crm.integration");
const event_repository_1 = require("../repositories/event.repository");
const crm = new crm_integration_1.CrmIntegration();
exports.integrationService = {
    async syncEvent(eventId, type, accountId, simulateFailure = false) {
        const current = await event_repository_1.eventRepository.findById(eventId);
        if (current?.syncStatus === client_1.SyncStatus.SUCCESS) {
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
            await event_repository_1.eventRepository.markSyncResult(eventId, client_1.SyncStatus.SUCCESS);
        }
        catch (error) {
            const failureReason = error instanceof Error ? error.message : 'Unknown CRM failure';
            await event_repository_1.eventRepository.markSyncResult(eventId, client_1.SyncStatus.FAILED, failureReason);
        }
    },
};
