import { Role } from '@prisma/client';

export function enforceAdmin(req, res, next) {
  if (req.auth?.payload?.role !== Role.ADMIN) {
    return res.status(403).json({
      message: 'Solo el administrador puede realizar esta acción',
    });
  }

  return next();
}
