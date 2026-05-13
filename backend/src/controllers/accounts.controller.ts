import { Role } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { accountService } from '../services/account.service';
import { eventService } from '../services/event.service';
import { idParamSchema } from '../validation/schemas';

export const accountsController = Router();

accountsController.use(authMiddleware);

accountsController.get('/', requireRoles(Role.ADMIN, Role.MANAGER, Role.BANKER, Role.USER), async (req, res) => {
  const accounts = await accountService.list(req.user!);
  res.json(accounts);
});

accountsController.get(
  '/:id/events',
  requireRoles(Role.ADMIN, Role.MANAGER, Role.USER),
  validate(idParamSchema, 'params'),
  async (req, res) => {
    const events = await eventService.listForAccount(req.user!, String(req.params.id));
    res.json(events);
  },
);

accountsController.get('/:id', requireRoles(Role.ADMIN, Role.MANAGER, Role.BANKER, Role.USER), validate(idParamSchema, 'params'), async (req, res) => {
  const account = await accountService.getById(req.user!, String(req.params.id));
  res.json(account);
});
