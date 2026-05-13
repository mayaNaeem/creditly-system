"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const api_error_1 = require("../errors/api-error");
const user_repository_1 = require("../repositories/user.repository");
exports.authService = {
    async login(email, password) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            throw new api_error_1.ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            throw new api_error_1.ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        const token = jsonwebtoken_1.default.sign({ role: user.role, bankId: user.bankId, email: user.email }, env_1.env.JWT_SECRET, {
            subject: user.id,
            expiresIn: '12h',
        });
        return {
            token,
            user: { id: user.id, email: user.email, role: user.role, bankId: user.bankId },
        };
    },
    ensureRole(allowed, role) {
        if (!allowed.includes(role)) {
            throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Operation not allowed for your role');
        }
    },
};
