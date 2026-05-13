"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const analytics_service_1 = require("../services/analytics.service");
exports.analyticsController = (0, express_1.Router)();
exports.analyticsController.use(auth_middleware_1.authMiddleware);
exports.analyticsController.get('/summary', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER), async (req, res) => {
    const summary = await analytics_service_1.analyticsService.summary(req.user);
    res.json(summary);
});
