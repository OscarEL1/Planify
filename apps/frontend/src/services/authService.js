import api from './api';

export async function login({ email, password }) {
  const response = await api.post('/auth/login', { email, password });

  // 🔧 AJUSTAR AQUÍ según la respuesta real del backend
  const { token, user } = response.data;

  if (token) {
    localStorage.setItem('planify_token', token);
  }

  return { user, token };
}

export function logout() {
  localStorage.removeItem('planify_token');
}

export function getToken() {
  return localStorage.getItem('planify_token');
}

export function isAuthenticated() {
  return Boolean(getToken());
}