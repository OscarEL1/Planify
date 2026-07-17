import { Priority, Role, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const VALID_PRIORITIES = new Set(Object.values(Priority));
const VALID_STATUSES = new Set(Object.values(TaskStatus));
const ACTIVITY_INCLUDE = {
  assignee: {
    select: { id: true, name: true, email: true, role: true },
  },
  comments: {
    select: { id: true, text: true, userId: true, createdAt: true },
  },
  subtasks: {
    select: { id: true, text: true, done: true },
    orderBy: { createdAt: 'asc' },
  },
};

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getActivitiesController({
  taskRepository = prisma.task,
} = {}) {
  return async function getActivities(req, res) {
    try {
      const activities = await taskRepository.findMany({
        include: ACTIVITY_INCLUDE,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(activities);
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
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
          subtasks: {
            create: Array.isArray(req.body?.subtasks)
              ? req.body.subtasks.map((st) => ({
                  text: typeof st.text === 'string' ? st.text.trim() : '',
                  done: typeof st.done === 'boolean' ? st.done : false,
                })).filter((st) => st.text)
              : [],
          },
        },
        include: ACTIVITY_INCLUDE,
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

export function updateActivityController({
  taskRepository = prisma.task,
  userRepository = prisma.user,
} = {}) {
  return async function updateActivity(req, res) {
    try {
      const existingActivity = await taskRepository.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });

      if (!existingActivity) {
        return res.status(404).json({ message: 'Actividad no encontrada' });
      }

      const body = req.body ?? {};
      const data = {};

      if (Object.hasOwn(body, 'title')) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
          return res.status(400).json({ message: 'El título no puede estar vacío' });
        }
        data.title = body.title.trim();
      }

      if (Object.hasOwn(body, 'description')) {
        if (body.description !== null && typeof body.description !== 'string') {
          return res.status(400).json({ message: 'La descripción no es válida' });
        }
        data.description = optionalText(body.description);
      }

      if (Object.hasOwn(body, 'priority')) {
        const priority = typeof body.priority === 'string'
          ? body.priority.trim().toUpperCase()
          : '';
        if (!VALID_PRIORITIES.has(priority)) {
          return res.status(400).json({
            message: 'La prioridad debe ser ALTA, MEDIA o BAJA',
          });
        }
        data.priority = priority;
      }

      if (Object.hasOwn(body, 'status')) {
        const status = typeof body.status === 'string'
          ? body.status.trim().toUpperCase()
          : '';
        if (!VALID_STATUSES.has(status)) {
          return res.status(400).json({
            message: 'El estado debe ser PENDIENTE, EN_PROCESO, EN_REVISION o COMPLETADA',
          });
        }
        data.status = status;
      }

      if (Object.hasOwn(body, 'dueDate')) {
        if (body.dueDate === null || body.dueDate === '') {
          data.dueDate = null;
        } else {
          const dueDate = new Date(body.dueDate);
          if (Number.isNaN(dueDate.getTime())) {
            return res.status(400).json({ message: 'La fecha límite no es válida' });
          }
          data.dueDate = dueDate;
        }
      }

      if (Object.hasOwn(body, 'evidenceUrl')) {
        if (body.evidenceUrl !== null && typeof body.evidenceUrl !== 'string') {
          return res.status(400).json({ message: 'El enlace de evidencia no es válido' });
        }
        data.evidenceUrl = optionalText(body.evidenceUrl);
      }

      if (Object.hasOwn(body, 'assigneeId')) {
        if (body.assigneeId === null || body.assigneeId === '') {
          data.assigneeId = null;
        } else {
          const assigneeId = typeof body.assigneeId === 'string'
            ? body.assigneeId.trim()
            : '';
          const assignee = assigneeId
            ? await userRepository.findUnique({
              where: { id: assigneeId },
              select: { id: true, role: true },
            })
            : null;

          if (!assignee || assignee.role !== Role.MIEMBRO_EQUIPO) {
            return res.status(400).json({
              message: 'El responsable debe ser un miembro del equipo registrado',
            });
          }
          data.assigneeId = assigneeId;
        }
      }

      if (Object.keys(data).length === 0 && !Array.isArray(body.subtasks)) {
        return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
      }

      // Si se envían subtareas, borrar las existentes y crear las nuevas
      if (Array.isArray(body.subtasks)) {
        const subtaskRepository = prisma.subtask;
        await subtaskRepository.deleteMany({
          where: { taskId: req.params.id },
        });
        if (body.subtasks.length > 0) {
          await subtaskRepository.createMany({
            data: body.subtasks
              .map((st) => ({
                text: typeof st.text === 'string' ? st.text.trim() : '',
                done: typeof st.done === 'boolean' ? st.done : false,
                taskId: req.params.id,
              }))
              .filter((st) => st.text),
          });
        }
      }

      const activity = await taskRepository.update({
        where: { id: req.params.id },
        data,
        include: ACTIVITY_INCLUDE,
      });

      return res.status(200).json(activity);
    } catch (error) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ message: 'Actividad no encontrada' });
      }

      if (error?.code === 'P2003') {
        return res.status(400).json({
          message: 'El responsable debe ser un miembro del equipo registrado',
        });
      }

      console.error('Error al actualizar actividad:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
