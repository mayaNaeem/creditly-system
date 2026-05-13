import { AuctionStatus } from '@prisma/client';

export type AuctionPublicDTO = {
  id: string;
  accountId: string;
  status: AuctionStatus;
  startDate: Date;
  endDate: Date;
};

export const toAuctionPublicDto = (auction: {
  id: string;
  accountId: string;
  status: AuctionStatus;
  startDate: Date;
  endDate: Date;
}): AuctionPublicDTO => ({
  id: auction.id,
  accountId: auction.accountId,
  status: auction.status,
  startDate: auction.startDate,
  endDate: auction.endDate,
});
