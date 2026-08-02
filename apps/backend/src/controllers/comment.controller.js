import { prisma } from '../lib/prisma.js';

const COMMENT_SELECT = {
  id: true,
  text: true,
  taskId: true,
  userId: true,
  createdAt: true,
  user: {
    select: { id: true, name: true },
  },
};

export function createCommentController({
  taskRepository = prisma.task,
  commentRepository = prisma.comment,
} = {}) {
  return async function createComment(req, res) {
    const { id: taskId } = req.params;
    const { text } = req.body;
    const userId = req.auth?.payload?.sub;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    try {
      const task = await taskRepository.findUnique({
        where: { id: taskId },
        select: { id: true },
      });

      if (!task) {
        return res.status(404).json({ message: 'Actividad no encontrada' });
      }

      const comment = await commentRepository.create({
        data: {
          text: text.trim(),
          taskId,
          userId,
        },
        select: COMMENT_SELECT,
      });

      return res.status(201).json(comment);
    } catch (error) {
      console.error('Error al crear comentario:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

export function getCommentsController({
  taskRepository = prisma.task,
  commentRepository = prisma.comment,
} = {}) {
  return async function getComments(req, res) {
    const { id: taskId } = req.params;

    try {
      const task = await taskRepository.findUnique({
        where: { id: taskId },
        select: { id: true },
      });

      if (!task) {
        return res.status(404).json({ message: 'Actividad no encontrada' });
      }

      const comments = await commentRepository.findMany({
        where: { taskId },
        select: COMMENT_SELECT,
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json(comments);
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
