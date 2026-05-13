import { Role } from '@prisma/client';
import { ApiError } from '../errors/api-error';
import { AccountPublicDTO } from '../dto/account-public.dto';
import { accountRepository } from '../repositories/account.repository';

type UserCtx = { id: string; role: Role; bankId: string | null };

const toBankerDto = (account: {
  id: string;
  status: string;
  auctions: { status: 'OPEN' | 'CLOSED' | 'EXPIRED'; endDate: Date }[];
}): AccountPublicDTO => {
  const latestAuction = account.auctions[0];
  const auctionStatus =
    latestAuction && latestAuction.status === 'OPEN' && latestAuction.endDate <= new Date()
      ? 'EXPIRED'
      : latestAuction?.status ?? null;

  return {
    id: account.id,
    status: account.status,
    auctionStatus,
  };
};

export const accountService = {
  async list(user: UserCtx) {
    if (user.role === Role.ADMIN) return accountRepository.listAll();
    if (user.role === Role.MANAGER) return accountRepository.listByManager(user.id);
    if (user.role === Role.USER) return accountRepository.listByCustomerUser(user.id);
    if (user.role === Role.BANKER) {
      const all = await accountRepository.listAllWithLatestAuction();
      return all.map(toBankerDto);
    }
    return [];
  },
  async getById(user: UserCtx, accountId: string) {
    if (user.role === Role.ADMIN) {
      const account = await accountRepository.findById(accountId);
      if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
      return account;
    }
    if (user.role === Role.BANKER) {
      const account = await accountRepository.findById(accountId);
      if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
      return toBankerDto(account);
    }
    const account = await accountRepository.findByIdScoped(accountId, user);
    if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
    return account;
  },
};
