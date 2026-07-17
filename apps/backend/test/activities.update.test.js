import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const member = { id: 'member-1', role: 'MIEMBRO_EQUIPO' };
const observer = { id: 'observer-1', role: 'OBSERVADOR' };

let updatedData;
let server;
let baseUrl;

const activities = new Set(['activity-1']);
const taskRepository = {
  findUnique: async ({ where }) => activities.has(where.id) ? { id: where.id } : null,
  update: async ({ where, data }) => {
    updatedData = data;
    return {
      id: where.id,
      title: data.title ?? 'Actividad original',
      description: data.description ?? null,
      status: data.status ?? 'PENDIENTE',
      priority: data.priority ?? 'MEDIA',
      dueDate: data.dueDate ?? new Date('2026-07-30T18:00:00.000Z'),
      evidenceUrl: data.evidenceUrl ?? null,
      assigneeId: Object.hasOwn(data, 'assigneeId') ? data.assigneeId : member.id,
      assignee: null,
      comments: [],
      createdAt: new Date('2026-07-17T12:00:00.000Z'),
      updatedAt: new Date('2026-07-18T12:00:00.000Z'),
    };
  },
};

const userRepository = {
  findUnique: async ({ where }) => {
    if (where.id === member.id) return member;
    if (where.id === observer.id) return observer;
    return null;
  },
};

const token = jwt.sign(
  { sub: 'editor-1', name: 'Editor', email: 'editor@planify.test', role: 'MIEMBRO_EQUIPO' },
  JWT_SECRET,
  { expiresIn: '24h', jwtid: randomUUID() },
);

before(async () => {
  const app = createApp({
    activityDependencies: {
      jwtSecret: JWT_SECRET,
      tokenBlacklist,
      userRepository,
      taskRepository,
    },
  });

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('PATCH /activities/:id', () => {
  function updateActivity(id, body, authToken = token) {
    return fetch(`${baseUrl}/activities/${id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  it('actualiza únicamente los campos enviados y retorna la actividad con 200', async () => {
    const response = await updateActivity('activity-1', {
      title: '  Actividad actualizada  ',
      status: 'en_proceso',
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, 'activity-1');
    assert.equal(body.title, 'Actividad actualizada');
    assert.equal(body.status, 'EN_PROCESO');
    assert.deepEqual(updatedData, {
      title: 'Actividad actualizada',
      status: 'EN_PROCESO',
    });
  });

  it('retorna 404 si la actividad no existe', async () => {
    const response = await updateActivity('missing-activity', { title: 'Nuevo título' });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Actividad no encontrada' });
  });

  it('retorna 400 si el título enviado queda vacío', async () => {
    const response = await updateActivity('activity-1', { title: '   ' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message: 'El título no puede estar vacío' });
  });

  it('valida prioridad, estado y fecha cuando son enviados', async () => {
    assert.equal((await updateActivity('activity-1', { priority: 'URGENTE' })).status, 400);
    assert.equal((await updateActivity('activity-1', { status: 'BLOQUEADA' })).status, 400);
    assert.equal((await updateActivity('activity-1', { dueDate: 'fecha-inválida' })).status, 400);
  });

  it('permite limpiar campos opcionales y desasignar al responsable', async () => {
    const response = await updateActivity('activity-1', {
      description: null,
      dueDate: null,
      evidenceUrl: null,
      assigneeId: null,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(updatedData, {
      description: null,
      dueDate: null,
      evidenceUrl: null,
      assigneeId: null,
    });
  });

  it('rechaza responsables inexistentes o que no sean miembros del equipo', async () => {
    const missing = await updateActivity('activity-1', { assigneeId: 'missing-user' });
    const invalidRole = await updateActivity('activity-1', { assigneeId: observer.id });

    assert.equal(missing.status, 400);
    assert.equal(invalidRole.status, 400);
  });

  it('retorna 400 cuando no se envían campos soportados', async () => {
    const response = await updateActivity('activity-1', { subtasks: [] });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message: 'No se enviaron campos para actualizar' });
  });

  it('retorna 401 si falta el token JWT', async () => {
    const response = await updateActivity('activity-1', { title: 'Nuevo título' }, null);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Token de autenticación requerido' });
  });
});
