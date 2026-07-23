import { Router } from 'express';
import {
  createActivityController,
  getActivitiesController,
  getActivityByIdController,
  updateActivityController,
  updateActivityStatusController,
} from '../controllers/activity.controller.js';
import { createCommentController } from '../controllers/comment.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createActivityRouter(dependencies = {}) {
  const router = Router();
  const authenticateToken = createAuthenticateToken({
    jwtSecret: dependencies.jwtSecret,
    tokenVerifier: dependencies.tokenVerifier,
    blacklist: dependencies.tokenBlacklist ?? tokenBlacklist,
  });

  router.get('/', authenticateToken, getActivitiesController(dependencies));
  router.get('/:id', authenticateToken, getActivityByIdController(dependencies));
  router.post('/', authenticateToken, createActivityController(dependencies));
  router.patch('/:id/status', authenticateToken, updateActivityStatusController(dependencies));
  router.patch('/:id', authenticateToken, updateActivityController(dependencies));
  router.post('/:id/comments', authenticateToken, createCommentController(dependencies));

  return router;
}
