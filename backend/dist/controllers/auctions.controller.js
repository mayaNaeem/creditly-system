"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionsController = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auction_service_1 = require("../services/auction.service");
const schemas_1 = require("../validation/schemas");
const auction_public_dto_1 = require("../dto/auction-public.dto");
exports.auctionsController = (0, express_1.Router)();
exports.auctionsController.use(auth_middleware_1.authMiddleware);
exports.auctionsController.post('/accounts/:id/auctions', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validate_middleware_1.validate)(schemas_1.idParamSchema, 'params'), async (req, res) => {
    const auction = await auction_service_1.auctionService.openAuction(req.user, String(req.params.id));
    res.status(201).json(auction);
});
exports.auctionsController.get('/auctions/open', (0, rbac_middleware_1.requireRoles)(client_1.Role.BANKER), async (req, res) => {
    const auctions = await auction_service_1.auctionService.listOpenAuctionsForBanker(req.user);
    const safe = auctions.map(auction_public_dto_1.toAuctionPublicDto);
    res.json(safe);
});
exports.auctionsController.post('/auctions/:id/offers', (0, rbac_middleware_1.requireRoles)(client_1.Role.BANKER), (0, validate_middleware_1.validate)(schemas_1.idParamSchema, 'params'), (0, validate_middleware_1.validate)(schemas_1.submitOfferSchema), async (req, res) => {
    const body = req.body;
    const offer = await auction_service_1.auctionService.submitOffer(req.user, String(req.params.id), body.interestRate);
    res.status(201).json(offer);
});
exports.auctionsController.post('/auctions/:id/close', (0, rbac_middleware_1.requireRoles)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validate_middleware_1.validate)(schemas_1.idParamSchema, 'params'), async (req, res) => {
    const result = await auction_service_1.auctionService.closeAuction(req.user, String(req.params.id));
    res.json(result);
});
