import { Prisma, Role, User } from '@prisma/client';
import { prisma } from '../db/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  create(data: Prisma.UserCreateInput & { role: Role }) {
    return prisma.user.create({ data });
  },
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
};
