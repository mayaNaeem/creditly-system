import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/db/prisma';

const secret = process.env.JWT_SECRET ?? 'super-secret-jwt';

const tokenFor = (id: string, role: Role, bankId?: string | null) =>
  jwt.sign({ role, bankId: bankId ?? null }, secret, { subject: id });

describe('Creditly backend', () => {
  let adminId: string;
  let managerId: string;
  let bankerId: string;
  let accountId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.offer.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.event.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    adminId = 'admin-1';
    managerId = 'manager-1';
    bankerId = 'banker-1';

    await prisma.user.createMany({
      data: [
        { id: adminId, email: 'admin@creditly.local', passwordHash: await bcrypt.hash('password123', 10), role: Role.ADMIN },
        { id: managerId, email: 'manager@creditly.local', passwordHash: await bcrypt.hash('password123', 10), role: Role.MANAGER },
        { id: bankerId, email: 'banker@creditly.local', passwordHash: await bcrypt.hash('password123', 10), role: Role.BANKER, bankId: 'bank-A' },
      ],
    });

    const account = await prisma.account.create({
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

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('banker cannot see sensitive data', async () => {
    const token = tokenFor(bankerId, Role.BANKER, 'bank-A');
    const res = await request(app).get(`/accounts/${accountId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.customerName).toBeUndefined();
    expect(res.body.email).toBeUndefined();
    expect(res.body.phone).toBeUndefined();
  });

  it('rbac enforcement blocks banker from creating event', async () => {
    const token = tokenFor(bankerId, Role.BANKER, 'bank-A');
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountId, type: 'note_added' });
    expect(res.status).toBe(403);
  });

  it('rejects offer submission after expiration', async () => {
    const adminToken = tokenFor(adminId, Role.ADMIN);
    const open = await request(app)
      .post(`/accounts/${accountId}/auctions`)
      .set('Authorization', `Bearer ${adminToken}`);
    const auctionId = open.body.id as string;
    await prisma.auction.update({ where: { id: auctionId }, data: { endDate: new Date(Date.now() - 1000) } });

    const bankerToken = tokenFor(bankerId, Role.BANKER, 'bank-A');
    const offer = await request(app)
      .post(`/auctions/${auctionId}/offers`)
      .set('Authorization', `Bearer ${bankerToken}`)
      .send({ interestRate: 2.1 });
    expect(offer.status).toBe(400);
  });

  it('selects best offer (lowest interest) on close', async () => {
    const adminToken = tokenFor(adminId, Role.ADMIN);
    const open = await request(app)
      .post(`/accounts/${accountId}/auctions`)
      .set('Authorization', `Bearer ${adminToken}`);
    const auctionId = open.body.id as string;

    await prisma.offer.createMany({
      data: [
        { auctionId, bankId: 'bank-A', interestRate: 6.4 },
        { auctionId, bankId: 'bank-B', interestRate: 3.5 },
      ],
    });

    const close = await request(app)
      .post(`/auctions/${auctionId}/close`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(close.status).toBe(200);
    expect(close.body.winner.interestRate).toBe(3.5);
  });

  it('persists crm integration failure status', async () => {
    const managerToken = tokenFor(managerId, Role.MANAGER);
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ accountId, type: 'document_uploaded', simulateIntegrationFailure: true });
    expect(res.status).toBe(201);
    const event = await prisma.event.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(event.syncStatus).toBe('FAILED');
    expect(event.failureReason).toBeTruthy();
  });
});
