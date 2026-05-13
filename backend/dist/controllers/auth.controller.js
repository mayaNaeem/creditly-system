"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const express_1 = require("express");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_service_1 = require("../services/auth.service");
const schemas_1 = require("../validation/schemas");
exports.authController = (0, express_1.Router)();
exports.authController.post('/login', (0, validate_middleware_1.validate)(schemas_1.loginSchema), async (req, res) => {
    const body = req.body;
    const result = await auth_service_1.authService.login(body.email, body.password);
    res.json(result);
});
