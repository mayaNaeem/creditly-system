"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const api_error_1 = require("../errors/api-error");
const errorMiddleware = (err, _req, res, _next) => {
    if (err instanceof api_error_1.ApiError) {
        res.status(err.status).json({ code: err.code, message: err.message });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid request' });
        return;
    }
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error' });
};
exports.errorMiddleware = errorMiddleware;
