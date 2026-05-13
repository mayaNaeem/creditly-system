"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = void 0;
const api_error_1 = require("../errors/api-error");
const requireRoles = (...roles) => (req, _res, next) => {
    if (!req.user) {
        throw new api_error_1.ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
        throw new api_error_1.ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    next();
};
exports.requireRoles = requireRoles;
