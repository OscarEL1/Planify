import { Router } from 'express';
import {
  createUsersController,
  createDeleteUserController,
  createInviteUserController,
  createUpdateUserRoleController,
} from '../controllers/users.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { enforceAdmin } from '../middleware/enforce-admin.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createUsersRouter(dependencies = {}) {
  const router = Router();
  const authenticateToken = createAuthenticateToken({
    jwtSecret: dependencies.jwtSecret,
    tokenVerifier: dependencies.tokenVerifier,
    blacklist: dependencies.tokenBlacklist ?? tokenBlacklist,
  });

  router.get('/', authenticateToken, createUsersController(dependencies));
  router.post('/', authenticateToken, enforceAdmin, createInviteUserController(dependencies));
  router.delete('/:id', authenticateToken, enforceAdmin, createDeleteUserController(dependencies));
  router.patch('/:id/role', authenticateToken, enforceAdmin, createUpdateUserRoleController(dependencies));

  return router;
}
