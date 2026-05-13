"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(8),
    PORT: zod_1.z.coerce.number().default(5000),
    CRM_BASE_URL: zod_1.z.string().url().default('https://example-crm.local'),
});
exports.env = envSchema.parse(process.env);
