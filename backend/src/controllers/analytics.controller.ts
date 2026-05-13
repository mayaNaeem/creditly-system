import { Role } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { analyticsService } from '../services/analytics.service';

export const analyticsController = Router();
analyticsController.use(authMiddleware);

analyticsController.get('/summary', requireRoles(Role.ADMIN, Role.MANAGER), async (req, res) => {
  const summary = await analyticsService.summary(req.user!);
  res.json(summary);
});
