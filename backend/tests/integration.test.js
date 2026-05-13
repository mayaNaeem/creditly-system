"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const app_1 = require("../src/app");
const prisma_1 = require("../src/db/prisma");
const secret = process.env.JWT_SECRET ?? 'super-secret-jwt';
const tokenFor = (id, role, bankId) => jsonwebtoken_1.default.sign({ role, bankId: bankId ?? null }, secret, { subject: id });
(0, vitest_1.describe)('Creditly backend', () => {
    let adminId;
    let managerId;
    let bankerId;
    let accountId;
    (0, vitest_1.beforeAll)(async () => {
        await prisma_1.prisma.$connect();
    });
    (0, vitest_1.beforeEach)(async () => {
        await prisma_1.prisma.offer.deleteMany();
        await prisma_1.prisma.auction.deleteMany();
        await prisma_1.prisma.event.deleteMany();
        await prisma_1.prisma.account.deleteMany();
        await prisma_1.prisma.user.deleteMany();
        adminId = 'admin-1';
        managerId = 'manager-1';
        bankerId = 'banker-1';
        await prisma_1.prisma.user.createMany({
            data: [
                { id: adminId, email: 'admin@creditly.local', passwordHash: await bcrypt_1.default.hash('password123', 10), role: client_1.Role.ADMIN },
                { id: managerId, email: 'manager@creditly.local', passwordHash: await bcrypt_1.default.hash('password123', 10), role: client_1.Role.MANAGER },
                { id: bankerId, email: 'banker@creditly.local', passwordHash: await bcrypt_1.default.hash('password123', 10), role: client_1.Role.BANKER, bankId: 'bank-A' },
            ],
        });
        const account = await prisma_1.prisma.account.create({
            data: {
                customerName: 'Sensitive Name',
                email: 'sensitive@customer.local',
                phone: '+10000000',
                status: 'ACTIVE',
                managerId,
            },
        });
        accountId = account.id;
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma_1.prisma.$disconnect();
    });
    (0, vitest_1.it)('banker cannot see sensitive data', async () => {
        const token = tokenFor(bankerId, client_1.Role.BANKER, 'bank-A');
        const res = await (0, supertest_1.default)(app_1.app).get(`/accounts/${accountId}`).set('Authorization', `Bearer ${token}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.customerName).toBeUndefined();
        (0, vitest_1.expect)(res.body.email).toBeUndefined();
        (0, vitest_1.expect)(res.body.phone).toBeUndefined();
    });
    (0, vitest_1.it)('rbac enforcement blocks banker from creating event', async () => {
        const token = tokenFor(bankerId, client_1.Role.BANKER, 'bank-A');
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/events')
            .set('Authorization', `Bearer ${token}`)
            .send({ accountId, type: 'note_added' });
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('rejects offer submission after expiration', async () => {
        const adminToken = tokenFor(adminId, client_1.Role.ADMIN);
        const open = await (0, supertest_1.default)(app_1.app)
            .post(`/accounts/${accountId}/auctions`)
            .set('Authorization', `Bearer ${adminToken}`);
        const auctionId = open.body.id;
        await prisma_1.prisma.auction.update({ where: { id: auctionId }, data: { endDate: new Date(Date.now() - 1000) } });
        const bankerToken = tokenFor(bankerId, client_1.Role.BANKER, 'bank-A');
        const offer = await (0, supertest_1.default)(app_1.app)
            .post(`/auctions/${auctionId}/offers`)
            .set('Authorization', `Bearer ${bankerToken}`)
            .send({ interestRate: 2.1 });
        (0, vitest_1.expect)(offer.status).toBe(400);
    });
    (0, vitest_1.it)('selects best offer (lowest interest) on close', async () => {
        const adminToken = tokenFor(adminId, client_1.Role.ADMIN);
        const open = await (0, supertest_1.default)(app_1.app)
            .post(`/accounts/${accountId}/auctions`)
            .set('Authorization', `Bearer ${adminToken}`);
        const auctionId = open.body.id;
        await prisma_1.prisma.offer.createMany({
            data: [
                { auctionId, bankId: 'bank-A', interestRate: 6.4 },
                { auctionId, bankId: 'bank-B', interestRate: 3.5 },
            ],
        });
        const close = await (0, supertest_1.default)(app_1.app)
            .post(`/auctions/${auctionId}/close`)
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(close.status).toBe(200);
        (0, vitest_1.expect)(close.body.winner.interestRate).toBe(3.5);
    });
    (0, vitest_1.it)('persists crm integration failure status', async () => {
        const managerToken = tokenFor(managerId, client_1.Role.MANAGER);
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/events')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ accountId, type: 'document_uploaded', simulateIntegrationFailure: true });
        (0, vitest_1.expect)(res.status).toBe(201);
        const event = await prisma_1.prisma.event.findUniqueOrThrow({ where: { id: res.body.id } });
        (0, vitest_1.expect)(event.syncStatus).toBe('FAILED');
        (0, vitest_1.expect)(event.failureReason).toBeTruthy();
    });
});
