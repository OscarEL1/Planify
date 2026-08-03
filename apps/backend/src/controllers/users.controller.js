import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(Object.values(Role));

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

export function createDeleteUserController({
  userRepository = prisma.user,
} = {}) {
  return async function deleteUser(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.auth?.payload?.sub;

      if (id === currentUserId) {
        return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
      }

      const user = await userRepository.findUnique({ where: { id } });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      await userRepository.delete({ where: { id } });

      return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

export function createInviteUserController({
  userRepository = prisma.user,
  passwordHasher = bcrypt.hash,
} = {}) {
  return async function inviteUser(req, res) {
    try {
      const { name, email, role } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
      }

      if (!email || !EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: 'El correo no tiene un formato válido' });
      }

      if (!role || !VALID_ROLES.has(role)) {
        return res.status(400).json({ message: 'El rol debe ser ADMIN, MIEMBRO_EQUIPO u OBSERVADOR' });
      }

      const existingUser = await userRepository.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }

      const tempPassword = await passwordHasher('planify2026', 12);

      const user = await userRepository.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: tempPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return res.status(201).json({
        message: 'Usuario creado correctamente. Contraseña temporal: planify2026',
        user,
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

export function createUpdateUserRoleController({
  userRepository = prisma.user,
} = {}) {
  return async function updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const currentUserId = req.auth?.payload?.sub;

      if (id === currentUserId) {
        return res.status(400).json({ message: 'No puedes cambiar tu propio rol' });
      }

      if (!role || !VALID_ROLES.has(role)) {
        return res.status(400).json({ message: 'El rol debe ser ADMIN, MIEMBRO_EQUIPO u OBSERVADOR' });
      }

      const user = await userRepository.findUnique({ where: { id } });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const updatedUser = await userRepository.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
