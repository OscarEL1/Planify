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
import { createCommentController, getCommentsController } from '../controllers/comment.controller.js';
import { createAuthenticateToken } from '../middleware/authenticate-token.js';
import { createRequireTeamMember, requireTeamMember } from '../middleware/require-team-member.js';
import { tokenBlacklist } from '../services/token-blacklist.js';

const requireCommentingMember = createRequireTeamMember({
  forbiddenMessage: 'Solo los miembros del equipo pueden publicar comentarios',
});

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
  router.patch('/:id/evidence', authenticateToken, updateActivityEvidenceController(dependencies));
  router.patch('/:id', authenticateToken, updateActivityController(dependencies));
  router.delete('/:id', authenticateToken, requireTeamMember, deleteActivityController(dependencies));
  router.get('/:id/comments', authenticateToken, getCommentsController(dependencies));
  router.post(
    '/:id/comments',
    authenticateToken,
    requireCommentingMember,
    createCommentController(dependencies),
  );

  return router;
}
