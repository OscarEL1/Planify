import { prisma } from '../lib/prisma.js';

export function getUsersController(dependencies = {}) {
  const prismaClient = dependencies.prisma ?? prisma;

  return async function getUsers(_req, res) {
    try {
      const users = await prismaClient.user.findMany({
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

      return res.status(200).json({
        users,
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);

      return res.status(500).json({
        message: 'No fue posible obtener los usuarios',
      });
    }
  };
}