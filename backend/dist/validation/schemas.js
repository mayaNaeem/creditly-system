"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.submitOfferSchema = exports.createAuctionSchema = exports.createEventSchema = exports.loginSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.createEventSchema = zod_1.z.object({
    accountId: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(client_1.EventType),
    simulateIntegrationFailure: zod_1.z.boolean().optional(),
});
exports.createAuctionSchema = zod_1.z.object({
    accountId: zod_1.z.string().min(1),
});
exports.submitOfferSchema = zod_1.z.object({
    interestRate: zod_1.z
        .number()
        .gt(0, 'Interest rate must be positive')
        .lte(100, 'Interest rate must be 100 or below'),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
