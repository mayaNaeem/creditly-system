import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors/api-error';

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid request' });
    return;
  }

  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error' });
};
