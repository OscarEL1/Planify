import { Router } from 'express';
import { createGetMeController, createLoginController } from '../controllers/auth.controller.js';
import { createLogoutController } from '../controllers/logout.controller.js';
import { createRegisterController } from '../controllers/register.controller.js';
import { createGetMeController } from '../controllers/me.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createAuthRouter(dependencies = {}) {
  const router = Router();
  const blacklist = dependencies.tokenBlacklist ?? tokenBlacklist;
  const authenticateToken = createAuthenticateToken({
    jwtSecret: dependencies.jwtSecret,
    tokenVerifier: dependencies.tokenVerifier,
    blacklist,
  });

  router.post('/login', createLoginController(dependencies));
  router.post('/register', createRegisterController(dependencies));
  router.post('/logout', authenticateToken, createLogoutController({ blacklist }));
  router.get('/me', authenticateToken, createGetMeController());

  return router;
}
