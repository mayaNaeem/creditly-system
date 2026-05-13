import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/api-error';

export const requireRoles = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
  }
  next();
};
