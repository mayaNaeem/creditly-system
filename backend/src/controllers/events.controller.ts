import { EventType, Role } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { eventService } from '../services/event.service';
import { createEventSchema } from '../validation/schemas';

export const eventsController = Router();
eventsController.use(authMiddleware);

eventsController.post('/', requireRoles(Role.ADMIN, Role.MANAGER, Role.USER), validate(createEventSchema), async (req, res) => {
  const body = req.body as { accountId: string; type: EventType; simulateIntegrationFailure?: boolean };
  const event = await eventService.create(
    req.user!,
    body.accountId,
    body.type,
    body.simulateIntegrationFailure ?? false,
  );
  res.status(201).json(event);
});
