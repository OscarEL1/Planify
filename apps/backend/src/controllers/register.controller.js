import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createRegisterController({
  userRepository = prisma.user,
  passwordHasher = bcrypt.hash,
} = {}) {
  return async function register(req, res) {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'El nombre, correo y contraseña son obligatorios',
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'El correo no tiene un formato válido' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    try {
      const existingUser = await userRepository.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }

      const hashedPassword = await passwordHasher(password, 12);
      const user = await userRepository.create({
        data: {
          name: fullName,
          email,
          password: hashedPassword,
          role: Role.MIEMBRO_EQUIPO,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return res.status(201).json({
        message: 'Usuario registrado correctamente',
        user,
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }

      console.error('Error al registrar usuario:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
