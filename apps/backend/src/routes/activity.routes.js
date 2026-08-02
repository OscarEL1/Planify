import { Router } from 'express';
import {
  createActivityController,
  deleteActivityController,
  getActivitiesController,
  getActivityByIdController,
  updateActivityController,
  updateActivityEvidenceController,
  updateActivityStatusController,
} from '../controllers/activity.controller.js';
import { getActivityStatsController } from '../controllers/activity-stats.controller.js';
import { createCommentController, getCommentsController } from '../controllers/comment.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { enforceWriteRole } from '../middleware/require-team-member.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createActivityRouter(dependencies = {}) {
  const router = Router();
  const authenticateToken = createAuthenticateToken({
    jwtSecret: dependencies.jwtSecret,
    tokenVerifier: dependencies.tokenVerifier,
    blacklist: dependencies.tokenBlacklist ?? tokenBlacklist,
  });

  router.use(authenticateToken, enforceWriteRole);

  router.get('/', getActivitiesController(dependencies));
  router.get('/stats', getActivityStatsController(dependencies));
  router.get('/:id', getActivityByIdController(dependencies));
  router.post('/', createActivityController(dependencies));
  router.patch('/:id/status', updateActivityStatusController(dependencies));
  router.patch('/:id/evidence', updateActivityEvidenceController(dependencies));
  router.patch('/:id', updateActivityController(dependencies));
  router.delete('/:id', deleteActivityController(dependencies));
  router.get('/:id/comments', getCommentsController(dependencies));
  router.post('/:id/comments', createCommentController(dependencies));

  return router;
}
