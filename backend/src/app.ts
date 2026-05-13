import cors from 'cors';
import express from 'express';
import { authController } from './controllers/auth.controller';
import { accountsController } from './controllers/accounts.controller';
import { eventsController } from './controllers/events.controller';
import { auctionsController } from './controllers/auctions.controller';
import { analyticsController } from './controllers/analytics.controller';
import { errorMiddleware } from './middleware/error.middleware';

export const app = express();
app.use(
  cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://localhost:4000', 'http://127.0.0.1:4000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authController);
app.use('/accounts', accountsController);
app.use('/events', eventsController);
app.use('/', auctionsController);
app.use('/analytics', analyticsController);
app.use(errorMiddleware);
