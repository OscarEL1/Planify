import { Priority, Role, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const VALID_PRIORITIES = new Set(Object.values(Priority));

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function createActivityController({
  taskRepository = prisma.task,
  userRepository = prisma.user,
} = {}) {
  return async function createActivity(req, res) {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = optionalText(req.body?.description);
    const assigneeId = typeof req.body?.assigneeId === 'string'
      ? req.body.assigneeId.trim()
      : '';
    const priority = typeof req.body?.priority === 'string'
      ? req.body.priority.trim().toUpperCase()
      : '';
    const dueDateValue = req.body?.dueDate;
    const evidenceUrl = optionalText(req.body?.evidenceUrl);

    if (!title) {
      return res.status(400).json({ message: 'El título es obligatorio' });
    }

    if (!assigneeId) {
      return res.status(400).json({ message: 'El responsable es obligatorio' });
    }

    if (!VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({
        message: 'La prioridad debe ser ALTA, MEDIA o BAJA',
      });
    }

    const dueDate = new Date(dueDateValue);
    if (!dueDateValue || Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({ message: 'La fecha límite no es válida' });
    }

    try {
      const assignee = await userRepository.findUnique({
        where: { id: assigneeId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!assignee || assignee.role !== Role.MIEMBRO_EQUIPO) {
        return res.status(400).json({
          message: 'El responsable debe ser un miembro del equipo registrado',
        });
      }

      const activity = await taskRepository.create({
        data: {
          title,
          description,
          assigneeId,
          priority,
          dueDate,
          status: TaskStatus.PENDIENTE,
          evidenceUrl,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, role: true },
          },
          comments: {
            select: { id: true, text: true, userId: true, createdAt: true },
          },
        },
      });

      return res.status(201).json({
        message: 'Actividad creada correctamente',
        activity,
      });
    } catch (error) {
      if (error?.code === 'P2003') {
        return res.status(400).json({
          message: 'El responsable debe ser un miembro del equipo registrado',
        });
      }

      console.error('Error al crear actividad:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
