"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const prisma_1 = require("../db/prisma");
exports.userRepository = {
    findByEmail(email) {
        return prisma_1.prisma.user.findUnique({ where: { email } });
    },
    create(data) {
        return prisma_1.prisma.user.create({ data });
    },
    findById(id) {
        return prisma_1.prisma.user.findUnique({ where: { id } });
    },
};
