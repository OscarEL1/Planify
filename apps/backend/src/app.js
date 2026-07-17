import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createAuthRouter } from './routes/auth.routes.js';
import { createActivityRouter } from './routes/activity.routes.js';

export function createApp(options = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', project: 'Planify Backend funcionando 🚀' });
  });

  app.use('/auth', createAuthRouter(options.authDependencies));
  app.use('/activities', createActivityRouter(options.activityDependencies));

  return app;
}
