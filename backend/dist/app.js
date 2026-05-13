"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./controllers/auth.controller");
const accounts_controller_1 = require("./controllers/accounts.controller");
const events_controller_1 = require("./controllers/events.controller");
const auctions_controller_1 = require("./controllers/auctions.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const error_middleware_1 = require("./middleware/error.middleware");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
exports.app.use(express_1.default.json());
exports.app.get('/health', (_req, res) => res.json({ ok: true }));
exports.app.use('/auth', auth_controller_1.authController);
exports.app.use('/accounts', accounts_controller_1.accountsController);
exports.app.use('/events', events_controller_1.eventsController);
exports.app.use('/', auctions_controller_1.auctionsController);
exports.app.use('/analytics', analytics_controller_1.analyticsController);
exports.app.use(error_middleware_1.errorMiddleware);
