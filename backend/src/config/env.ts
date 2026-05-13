import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(5000),
  CRM_BASE_URL: z.string().url().default('https://example-crm.local'),
});

export const env = envSchema.parse(process.env);
