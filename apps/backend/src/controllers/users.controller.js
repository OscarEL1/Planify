import { prisma } from '../lib/prisma.js';

export function createUsersController({
  userRepository = prisma.user,
} = {}) {
  return async function getUsers(req, res) {
    try {
      const users = await userRepository.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
