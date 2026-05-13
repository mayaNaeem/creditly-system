import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { ApiError } from '../errors/api-error';
import { userRepository } from '../repositories/user.repository';

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = jwt.sign({ role: user.role, bankId: user.bankId, email: user.email }, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: '12h',
    });

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, bankId: user.bankId },
    };
  },
  ensureRole(allowed: Role[], role: Role) {
    if (!allowed.includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Operation not allowed for your role');
    }
  },
};
