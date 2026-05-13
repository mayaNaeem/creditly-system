"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma_1 = require("./db/prisma");
const PASSWORD = 'Creditly123!';
async function main() {
    await prisma_1.prisma.offer.deleteMany();
    await prisma_1.prisma.auction.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.account.deleteMany();
    await prisma_1.prisma.user.deleteMany();
    const passwordHash = await bcrypt_1.default.hash(PASSWORD, 10);
    const admin = await prisma_1.prisma.user.create({
        data: { email: 'admin@creditly.demo', passwordHash, role: client_1.Role.ADMIN },
    });
    const manager = await prisma_1.prisma.user.create({
        data: { email: 'manager@creditly.demo', passwordHash, role: client_1.Role.MANAGER },
    });
    const banker = await prisma_1.prisma.user.create({
        data: { email: 'banker@creditly.demo', passwordHash, role: client_1.Role.BANKER, bankId: 'bank-demo-a' },
    });
    const bankerB = await prisma_1.prisma.user.create({
        data: { email: 'banker-b@creditly.demo', passwordHash, role: client_1.Role.BANKER, bankId: 'bank-demo-b' },
    });
    const customer = await prisma_1.prisma.user.create({
        data: { email: 'customer@creditly.demo', passwordHash, role: client_1.Role.USER },
    });
    await prisma_1.prisma.account.create({
        data: {
            customerName: 'Acme Corp',
            email: 'billing@acme.example',
            phone: '+1-555-0100',
            status: 'ACTIVE',
            managerId: manager.id,
        },
    });
    await prisma_1.prisma.account.create({
        data: {
            customerName: 'Jane Customer',
            email: 'jane@example.com',
            phone: '+1-555-0200',
            status: 'PENDING',
            managerId: manager.id,
            customerUserId: customer.id,
        },
    });
    console.log('Seed complete. Demo password for all users:', PASSWORD);
    console.log('Users:', {
        admin: admin.email,
        manager: manager.email,
        banker: banker.email,
        bankerB: bankerB.email,
        customer: customer.email,
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
