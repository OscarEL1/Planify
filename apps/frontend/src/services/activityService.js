import api from './api';

const RESOURCE = '/activities'; // 🔧 cambiar a '/tasks' si el backend usa ese nombre

export async function getActivities() {
  const response = await api.get(RESOURCE);
  return response.data;
}

export async function createActivity(payload) {
  const response = await api.post(RESOURCE, normalizePayload(payload));
  return response.data.activity;
}

export async function updateActivity(id, payload) {
  const response = await api.patch(`${RESOURCE}/${id}`, normalizePayload(payload));
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

// 🔧 Endpoint de subtareas no confirmado en el backend. Ajustar
// ruta/payload cuando exista. Por ahora se envían anidadas en el
// mismo PATCH de la actividad (ver normalizePayload → subtasks).
export async function addComment(activityId, text) {
  // 🔧 Backend aún no expone POST /activities/:id/comments
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
    subtasks: subtasks || [], // 🔧 confirmar si el backend soporta este campo
  };
}