import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authService } from '../services/auth.service';
import { loginSchema } from '../validation/schemas';

export const authController = Router();

authController.post('/login', validate(loginSchema), async (req, res) => {
  const body = req.body as { email: string; password: string };
  const result = await authService.login(body.email, body.password);
  res.json(result);
});
