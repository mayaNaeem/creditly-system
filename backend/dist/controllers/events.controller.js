"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsController = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const event_service_1 = require("../services/event.service");
const schemas_1 = require("../validation/schemas");
exports.eventsController = (0, express_1.Router)();
exports.eventsController.use(auth_middleware_1.authMiddleware);
exports.eventsController.post('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.USER), (0, validate_middleware_1.validate)(schemas_1.createEventSchema), async (req, res) => {
    const body = req.body;
    const event = await event_service_1.eventService.create(req.user, body.accountId, body.type, body.simulateIntegrationFailure ?? false);
    res.status(201).json(event);
});
