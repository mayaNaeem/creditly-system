import { EventType, Role } from '@prisma/client';
import { ApiError } from '../errors/api-error';
import { accountRepository } from '../repositories/account.repository';
import { eventRepository } from '../repositories/event.repository';
import { integrationService } from './integration.service';

type UserCtx = { id: string; role: Role; bankId: string | null };

const CRM_TYPES = new Set<EventType>([
  EventType.status_changed,
  EventType.document_uploaded,
  EventType.auction_opened,
  EventType.winning_offer_selected,
]);

export const eventService = {
  async listForAccount(user: UserCtx, accountId: string) {
    if (user.role === Role.BANKER) {
      throw new ApiError(403, 'FORBIDDEN', 'Bankers cannot view account events');
    }
    if (user.role === Role.ADMIN) {
      const account = await accountRepository.findById(accountId);
      if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
    } else {
      const account = await accountRepository.findByIdScoped(accountId, user);
      if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
    }
    return eventRepository.listByAccount(accountId);
  },
  async create(user: UserCtx, accountId: string, type: EventType, simulateIntegrationFailure = false) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.USER) {
      throw new ApiError(403, 'FORBIDDEN', 'Role cannot create events');
    }
    const account = await accountRepository.findById(accountId);
    if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');

    if (user.role === Role.MANAGER && account.managerId !== user.id) {
      throw new ApiError(403, 'FORBIDDEN', 'Account not assigned to this manager');
    }
    if (user.role === Role.USER && account.customerUserId !== user.id) {
      throw new ApiError(403, 'FORBIDDEN', 'Account not linked to this user');
    }

    const event = await eventRepository.create({ accountId, type, createdBy: user.id });
    if (type === EventType.document_uploaded) {
      await accountRepository.update(accountId, { lastActivity: new Date() });
    }
    const count = await eventRepository.countLast24h(accountId);
    if (count > 3) {
      await accountRepository.update(accountId, { isHighActivity: true });
    }
    if (CRM_TYPES.has(type)) {
      await integrationService.syncEvent(event.id, type, accountId, simulateIntegrationFailure);
    }
    return event;
  },
};
