import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';

export function createLoginController({
  userRepository = prisma.user,
  passwordComparer = bcrypt.compare,
  tokenSigner = jwt.sign,
  jwtSecret = process.env.JWT_SECRET,
} = {}) {
  return async function login(req, res) {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son obligatorios' });
    }

    if (!jwtSecret) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({ message: 'El servicio de autenticación no está configurado' });
    }

    try {
      const user = await userRepository.findUnique({ where: { email } });
      const passwordIsValid = user
        ? await passwordComparer(password, user.password)
        : false;

      if (!user || !passwordIsValid) {
        return res.status(401).json({ message: INVALID_CREDENTIALS });
      }

      const token = tokenSigner(
        { sub: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '24h', jwtid: randomUUID() },
      );

      return res.status(200).json({
        token,
        expiresIn: '24h',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}
