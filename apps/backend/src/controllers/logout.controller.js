import { tokenBlacklist } from '../services/token-blacklist.js';

export function createLogoutController({ blacklist = tokenBlacklist } = {}) {
  return function logout(req, res) {
    blacklist.revoke(req.auth.token, req.auth.payload.exp);

    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  };
}
