import { EventType } from '@prisma/client';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createEventSchema = z.object({
  accountId: z.string().min(1),
  type: z.nativeEnum(EventType),
  simulateIntegrationFailure: z.boolean().optional(),
});

export const createAuctionSchema = z.object({
  accountId: z.string().min(1),
});

export const submitOfferSchema = z.object({
  interestRate: z
    .number()
    .gt(0, 'Interest rate must be positive')
    .lte(100, 'Interest rate must be 100 or below'),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});
