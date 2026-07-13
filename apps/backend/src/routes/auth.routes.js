import { Router } from 'express';
import { createLoginController } from '../controllers/auth.controller.js';

export function createAuthRouter(dependencies) {
  const router = Router();

  router.post('/login', createLoginController(dependencies));

  return router;
}
