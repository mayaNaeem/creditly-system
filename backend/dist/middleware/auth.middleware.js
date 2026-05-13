"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const api_error_1 = require("../errors/api-error");
const authMiddleware = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw new api_error_1.ApiError(401, 'UNAUTHORIZED', 'Missing bearer token');
    }
    try {
        const token = header.slice('Bearer '.length);
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = { id: payload.sub, role: payload.role, bankId: payload.bankId ?? null, email: payload.email };
        next();
    }
    catch {
        throw new api_error_1.ApiError(401, 'UNAUTHORIZED', 'Invalid bearer token');
    }
};
exports.authMiddleware = authMiddleware;
