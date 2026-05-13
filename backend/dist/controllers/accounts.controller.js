"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsController = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const account_service_1 = require("../services/account.service");
const event_service_1 = require("../services/event.service");
const schemas_1 = require("../validation/schemas");
exports.accountsController = (0, express_1.Router)();
exports.accountsController.use(auth_middleware_1.authMiddleware);
exports.accountsController.get('/', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.BANKER, client_1.Role.USER), async (req, res) => {
    const accounts = await account_service_1.accountService.list(req.user);
    res.json(accounts);
});
exports.accountsController.get('/:id/events', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.USER), (0, validate_middleware_1.validate)(schemas_1.idParamSchema, 'params'), async (req, res) => {
    const events = await event_service_1.eventService.listForAccount(req.user, String(req.params.id));
    res.json(events);
});
exports.accountsController.get('/:id', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.BANKER, client_1.Role.USER), (0, validate_middleware_1.validate)(schemas_1.idParamSchema, 'params'), async (req, res) => {
    const account = await account_service_1.accountService.getById(req.user, String(req.params.id));
    res.json(account);
});
