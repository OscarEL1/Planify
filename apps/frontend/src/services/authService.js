import api from './api';

// HU-01: login guarda token y user (para Navbar/DashboardPage sin ir a la BD)
export async function login({ email, password }) {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;

  if (token) {
    localStorage.setItem('planify_token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  return { user, token };
}

// HU-16: el backend espera fullName (no name/confirmPassword)
export async function register({ fullName, email, password }) {
  const response = await api.post('/auth/register', { fullName, email, password });
  return response.data;
}

// HU-02: revoca el token en el backend (blacklist) antes de limpiar el storage local
export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('planify_token');
    localStorage.removeItem('user');
  }
}

export function getToken() {
  return localStorage.getItem('planify_token');
}

export function getTokenPayload() {
  const token = getToken();
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) =>
          `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
        )
        .join('')
    );

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getSessionUser() {
  const payload = getTokenPayload();

  if (payload) {
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  }

  return getUser();
}

// HU-17: usado por Navbar/DashboardPage para mostrar los datos del usuario
export function getUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}
