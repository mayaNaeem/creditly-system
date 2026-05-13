import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserContext {
      id: string;
      role: Role;
      bankId: string | null;
      email?: string;
    }
    interface Request {
      user?: UserContext;
    }
  }
}

export {};
