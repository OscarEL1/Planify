import { Router } from 'express';
import { getUsersController } from '../controllers/user.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createUserRouter(dependencies = {}) {
  const router = Router();

  const authenticateToken = createAuthenticateToken({
    jwtSecret: dependencies.jwtSecret,
    tokenVerifier: dependencies.tokenVerifier,
    blacklist: dependencies.tokenBlacklist ?? tokenBlacklist,
  });

  router.get(
    '/',
    authenticateToken,
    getUsersController(dependencies),
  );

  return router;
}