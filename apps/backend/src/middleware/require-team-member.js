import { Role } from '@prisma/client';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'DELETE']);

export function enforceWriteRole(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) {
    return next();
  }

  if (req.auth?.payload?.role !== Role.MIEMBRO_EQUIPO) {
    return res.status(403).json({
      message: 'Solo los miembros del equipo pueden realizar acciones de escritura',
    });
  }

  return next();
}
