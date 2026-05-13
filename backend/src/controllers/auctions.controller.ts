import { Role } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { auctionService } from '../services/auction.service';
import { idParamSchema, submitOfferSchema } from '../validation/schemas';
import { toAuctionPublicDto } from '../dto/auction-public.dto';

export const auctionsController = Router();
auctionsController.use(authMiddleware);

auctionsController.post('/accounts/:id/auctions', requireRoles(Role.ADMIN, Role.MANAGER), validate(idParamSchema, 'params'), async (req, res) => {
  const auction = await auctionService.openAuction(req.user!, String(req.params.id));
  res.status(201).json(auction);
});

auctionsController.get('/auctions/open', requireRoles(Role.BANKER), async (req, res) => {
  const auctions = await auctionService.listOpenAuctionsForBanker(req.user!);
  const safe = auctions.map(toAuctionPublicDto);
  res.json(safe);
});

auctionsController.post('/auctions/:id/offers', requireRoles(Role.BANKER), validate(idParamSchema, 'params'), validate(submitOfferSchema), async (req, res) => {
  const body = req.body as { interestRate: number };
  const offer = await auctionService.submitOffer(req.user!, String(req.params.id), body.interestRate);
  res.status(201).json(offer);
});

auctionsController.post('/auctions/:id/close', requireRoles(Role.ADMIN, Role.MANAGER), validate(idParamSchema, 'params'), async (req, res) => {
  const result = await auctionService.closeAuction(req.user!, String(req.params.id));
  res.json(result);
});
