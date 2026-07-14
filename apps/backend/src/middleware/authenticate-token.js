import jwt from 'jsonwebtoken';
import { tokenBlacklist } from '../services/token-blacklist.js';

export function createAuthenticateToken({
  jwtSecret = process.env.JWT_SECRET,
  tokenVerifier = jwt.verify,
  blacklist = tokenBlacklist,
} = {}) {
  return function authenticateToken(req, res, next) {
    const authorization = req.get('authorization');
    const [scheme, token, extra] = authorization?.split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    if (!jwtSecret) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({ message: 'El servicio de autenticación no está configurado' });
    }

    try {
      const payload = tokenVerifier(token, jwtSecret);

      if (blacklist.isRevoked(token)) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      req.auth = { token, payload };
      return next();
    } catch {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };
}
