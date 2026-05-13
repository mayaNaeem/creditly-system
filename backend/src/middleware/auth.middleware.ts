import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { ApiError } from '../errors/api-error';

type TokenPayload = {
  sub: string;
  role: Role;
  bankId?: string | null;
  email?: string;
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing bearer token');
  }

  try {
    const token = header.slice('Bearer '.length);
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: payload.sub, role: payload.role, bankId: payload.bankId ?? null, email: payload.email };
    next();
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid bearer token');
  }
};
