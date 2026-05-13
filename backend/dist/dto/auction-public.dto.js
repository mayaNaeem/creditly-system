"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAuctionPublicDto = void 0;
const toAuctionPublicDto = (auction) => ({
    id: auction.id,
    accountId: auction.accountId,
    status: auction.status,
    startDate: auction.startDate,
    endDate: auction.endDate,
});
exports.toAuctionPublicDto = toAuctionPublicDto;
