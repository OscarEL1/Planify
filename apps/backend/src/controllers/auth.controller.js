import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';
// Se mantienen los campos en inglés (email/password/name) para no romper el
// contrato ya usado por /auth/login y el schema de Prisma.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Formato de correo inválido.' });
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
        { sub: user.id, name: user.name, email: user.email, role: user.role },
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

// HU-16: registro de nuevas cuentas (rol MIEMBRO_EQUIPO por defecto)
export function createRegisterController({
  userRepository = prisma.user,
  passwordHasher = bcrypt.hash,
} = {}) {
  return async function register(req, res) {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const confirmPassword = typeof req.body?.confirmPassword === 'string'
      ? req.body.confirmPassword
      : '';

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Formato de correo inválido.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    try {
      const existingUser = await userRepository.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Este correo ya está registrado' });
      }

      const hashedPassword = await passwordHasher(password, 10);

      await userRepository.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'MIEMBRO_EQUIPO',
        },
      });

      return res.status(201).json({
        message: 'Cuenta creada exitosamente. Inicia sesión para continuar.',
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

// HU-17: los datos vienen del payload del JWT verificado por authenticateToken.
export function createGetMeController() {
  return function getMe(req, res) {
    const { sub, name, email, role } = req.auth.payload;

    if (!sub || !name || !email || !role) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    return res.status(200).json({ id: sub, name, email, role });
  };
}

// HU-02: con JWT stateless el logout real ocurre en el cliente (se borra el
// token). El endpoint existe para mantener el contrato de la API y para una
// futura blacklist de tokens.
export function createLogoutController() {
  return function logout(_req, res) {
    return res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
  };
}
