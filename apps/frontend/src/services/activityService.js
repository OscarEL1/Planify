import api from './api';

const RESOURCE = '/activities';

function convertDateToISO(value) {
  if (!value) return null;

  // Evita problemas de desfase por zona horaria.
  return new Date(`${value}T12:00:00`).toISOString();
}

function normalizeCreatePayload(payload) {
  return {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    assigneeId: payload.assigneeId,
    priority: payload.priority,
    dueDate: convertDateToISO(payload.dueDate),
    evidenceUrl: payload.evidenceUrl?.trim() || null,
  };
}

function normalizePatchPayload(payload) {
  const normalized = {};

  if (Object.hasOwn(payload, 'title')) {
    normalized.title = payload.title.trim();
  }

  if (Object.hasOwn(payload, 'description')) {
    normalized.description = payload.description?.trim() || null;
  }

  if (Object.hasOwn(payload, 'assigneeId')) {
    normalized.assigneeId = payload.assigneeId || null;
  }

  if (Object.hasOwn(payload, 'priority')) {
    normalized.priority = payload.priority;
  }

  if (Object.hasOwn(payload, 'status')) {
    normalized.status = payload.status;
  }

  if (Object.hasOwn(payload, 'dueDate')) {
    normalized.dueDate = payload.dueDate
      ? convertDateToISO(payload.dueDate)
      : null;
  }

  if (Object.hasOwn(payload, 'evidenceUrl')) {
    normalized.evidenceUrl = payload.evidenceUrl?.trim() || null;
  }

  return normalized;
}



export async function createActivity(payload) {
  const response = await api.post(
    RESOURCE,
    normalizeCreatePayload(payload),
  );

  // POST devuelve { message, activity }
  return response.data.activity;
}

export async function updateActivity(id, payload) {
  const response = await api.patch(
    `${RESOURCE}/${id}`,
    normalizePatchPayload(payload),
  );

  // PATCH devuelve directamente la actividad.
  return response.data;
}

export async function getUsers() {
  const response = await api.get('/users');

  return Array.isArray(response.data)
    ? response.data
    : response.data.users ?? [];
}