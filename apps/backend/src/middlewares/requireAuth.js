import jwt from 'jsonwebtoken';

// HU-01/HU-17: protege rutas exigiendo un JWT válido en Authorization: Bearer <token>
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Acceso no autorizado. Inicia sesión.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Sesión expirada. Inicia sesión nuevamente.' });
  }
}
