import { TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

function percentage(completed, total) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function getActivityStatsController({
  taskRepository = prisma.task,
} = {}) {
  return async function getActivityStats(_req, res) {
    try {
      const activities = await taskRepository.findMany({
        select: {
          status: true,
          assignee: {
            select: { id: true, name: true },
          },
        },
      });

      const byStatus = Object.fromEntries(
        Object.values(TaskStatus).map((status) => [status, 0]),
      );
      const assigneeStats = new Map();

      for (const activity of activities) {
        byStatus[activity.status] += 1;

        if (!activity.assignee) continue;

        const current = assigneeStats.get(activity.assignee.id) ?? {
          assigneeId: activity.assignee.id,
          name: activity.assignee.name,
          completed: 0,
          total: 0,
        };

        current.total += 1;
        if (activity.status === TaskStatus.COMPLETADA) {
          current.completed += 1;
        }
        assigneeStats.set(activity.assignee.id, current);
      }

      const total = activities.length;
      const progressByAssignee = [...assigneeStats.values()]
        .map((assignee) => ({
          ...assignee,
          completionPercentage: percentage(assignee.completed, assignee.total),
        }))
        .sort((a, b) => (
          b.completionPercentage - a.completionPercentage
          || a.name.localeCompare(b.name, 'es')
        ));

      return res.status(200).json({
        byStatus,
        total,
        completionPercentage: percentage(byStatus[TaskStatus.COMPLETADA], total),
        progressByAssignee,
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de actividades:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
