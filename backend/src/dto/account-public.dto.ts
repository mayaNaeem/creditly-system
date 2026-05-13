export type AccountPublicDTO = {
  id: string;
  status: string;
  auctionStatus: 'OPEN' | 'CLOSED' | 'EXPIRED' | null;
};
