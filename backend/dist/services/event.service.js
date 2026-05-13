"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventService = void 0;
const client_1 = require("@prisma/client");
const api_error_1 = require("../errors/api-error");
const account_repository_1 = require("../repositories/account.repository");
const event_repository_1 = require("../repositories/event.repository");
const integration_service_1 = require("./integration.service");
const CRM_TYPES = new Set([
    client_1.EventType.status_changed,
    client_1.EventType.document_uploaded,
    client_1.EventType.auction_opened,
    client_1.EventType.winning_offer_selected,
]);
exports.eventService = {
    async listForAccount(user, accountId) {
        if (user.role === client_1.Role.BANKER) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Bankers cannot view account events');
        }
        if (user.role === client_1.Role.ADMIN) {
            const account = await account_repository_1.accountRepository.findById(accountId);
            if (!account)
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
        }
        else {
            const account = await account_repository_1.accountRepository.findByIdScoped(accountId, user);
            if (!account)
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
        }
        return event_repository_1.eventRepository.listByAccount(accountId);
    },
    async create(user, accountId, type, simulateIntegrationFailure = false) {
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.MANAGER && user.role !== client_1.Role.USER) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Role cannot create events');
        }
        const account = await account_repository_1.accountRepository.findById(accountId);
        if (!account)
            throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
        if (user.role === client_1.Role.MANAGER && account.managerId !== user.id) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Account not assigned to this manager');
        }
        if (user.role === client_1.Role.USER && account.customerUserId !== user.id) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Account not linked to this user');
        }
        const event = await event_repository_1.eventRepository.create({ accountId, type, createdBy: user.id });
        if (type === client_1.EventType.document_uploaded) {
            await account_repository_1.accountRepository.update(accountId, { lastActivity: new Date() });
        }
        const count = await event_repository_1.eventRepository.countLast24h(accountId);
        if (count > 3) {
            await account_repository_1.accountRepository.update(accountId, { isHighActivity: true });
        }
        if (CRM_TYPES.has(type)) {
            await integration_service_1.integrationService.syncEvent(event.id, type, accountId, simulateIntegrationFailure);
        }
        return event;
    },
};
