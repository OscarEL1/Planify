import { Role } from '@prisma/client';

export function requireTeamMember(req, res, next) {
  if (req.auth?.payload?.role !== Role.MIEMBRO_EQUIPO) {
    return res.status(403).json({
      message: 'Solo los miembros del equipo pueden eliminar actividades',
    });
  }

  return next();
}
