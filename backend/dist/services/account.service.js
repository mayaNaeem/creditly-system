"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = void 0;
const client_1 = require("@prisma/client");
const api_error_1 = require("../errors/api-error");
const account_repository_1 = require("../repositories/account.repository");
const toBankerDto = (account) => {
    const latestAuction = account.auctions[0];
    const auctionStatus = latestAuction && latestAuction.status === 'OPEN' && latestAuction.endDate <= new Date()
        ? 'EXPIRED'
        : latestAuction?.status ?? null;
    return {
        id: account.id,
        status: account.status,
        auctionStatus,
    };
};
exports.accountService = {
    async list(user) {
        if (user.role === client_1.Role.ADMIN)
            return account_repository_1.accountRepository.listAll();
        if (user.role === client_1.Role.MANAGER)
            return account_repository_1.accountRepository.listByManager(user.id);
        if (user.role === client_1.Role.USER)
            return account_repository_1.accountRepository.listByCustomerUser(user.id);
        if (user.role === client_1.Role.BANKER) {
            const all = await account_repository_1.accountRepository.listAllWithLatestAuction();
            return all.map(toBankerDto);
        }
        return [];
    },
    async getById(user, accountId) {
        if (user.role === client_1.Role.ADMIN) {
            const account = await account_repository_1.accountRepository.findById(accountId);
            if (!account)
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
            return account;
        }
        if (user.role === client_1.Role.BANKER) {
            const account = await account_repository_1.accountRepository.findById(accountId);
            if (!account)
                throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
            return toBankerDto(account);
        }
        const account = await account_repository_1.accountRepository.findByIdScoped(accountId, user);
        if (!account)
            throw new api_error_1.ApiError(404, 'NOT_FOUND', 'Account not found');
        return account;
    },
};
