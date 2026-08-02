import { Role } from '@prisma/client';

export function createRequireTeamMember({
  forbiddenMessage = 'Solo los miembros del equipo pueden realizar esta acción',
} = {}) {
  return function requireConfiguredTeamMember(req, res, next) {
    if (req.auth?.payload?.role !== Role.MIEMBRO_EQUIPO) {
      return res.status(403).json({ message: forbiddenMessage });
    }

    return next();
  };
}

export const requireTeamMember = createRequireTeamMember({
  forbiddenMessage: 'Solo los miembros del equipo pueden eliminar actividades',
});
