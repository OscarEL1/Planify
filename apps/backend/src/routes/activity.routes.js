import { Router } from 'express';
import { createActivityController } from '../controllers/activity.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createActivityRouter(dependencies = {}) {
  const router = Router();
  const authenticateToken = createAuthenticateToken({
    jwtSecret: dependencies.jwtSecret,
    tokenVerifier: dependencies.tokenVerifier,
    blacklist: dependencies.tokenBlacklist ?? tokenBlacklist,
  });

  router.post('/', authenticateToken, createActivityController(dependencies));

  return router;
}
