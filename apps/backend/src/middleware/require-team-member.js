import { Role } from '@prisma/client';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'DELETE']);
const WRITE_ROLES = new Set([Role.MIEMBRO_EQUIPO, Role.ADMIN]);

export function enforceWriteRole(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) {
    return next();
  }

  if (!WRITE_ROLES.has(req.auth?.payload?.role)) {
    return res.status(403).json({
      message: 'Solo los miembros del equipo pueden realizar acciones de escritura',
    });
  }

  return next();
}
