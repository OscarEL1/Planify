import api from './api';

const RESOURCE = '/activities';

export async function getActivities() {
  const response = await api.get(RESOURCE);
  return response.data;
}

export async function getActivityStats() {
  const response = await api.get(`${RESOURCE}/stats`);
  return response.data;
}

export async function getActivityById(id) {
  const response = await api.get(`${RESOURCE}/${id}`);
  return response.data;
}

export async function createActivity(payload) {
  const response = await api.post(RESOURCE, normalizePayload(payload));
  return response.data.activity;
}

export async function updateActivity(id, payload) {
  const response = await api.patch(`${RESOURCE}/${id}`, payload);
  return response.data;
}

export async function updateActivityStatus(id, status) {
  const response = await api.patch(`${RESOURCE}/${id}/status`, { status });
  return response.data;
}

// HU evidencia: actualiza únicamente el enlace de evidencia,
// usando su propio endpoint (no el PATCH general de la actividad).
export async function updateActivityEvidence(id, evidenceUrl) {
  const response = await api.patch(`${RESOURCE}/${id}/evidence`, {
    evidenceUrl: evidenceUrl?.trim() || null,
  });
  return response.data;
}

export async function deleteActivity(id) {
  await api.delete(`${RESOURCE}/${id}`);
  return id;
}

export async function getUsers() {
  const response = await api.get('/users');
  return response.data;
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
  return id;
}

export async function inviteUser({ name, email, role }) {
  const response = await api.post('/users', { name, email, role });
  return response.data.user;
}

export async function updateUserRole(id, role) {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data;
}

export async function addComment(activityId, text) {
  const response = await api.post(`${RESOURCE}/${activityId}/comments`, { text });
  return response.data;
}

function normalizePayload({ title, description, status, priority, dueDate, evidenceUrl, assigneeId, subtasks }) {
  return {
    title: title.trim(),
    description: description?.trim() || null,
    status,
    priority,
    dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
    evidenceUrl: evidenceUrl?.trim() || null,
    assigneeId: assigneeId || null,
    subtasks: subtasks || [],
  };
}