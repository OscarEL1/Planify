import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const activities = new Map([
  ['activity-with-evidence', { id: 'activity-with-evidence', evidenceUrl: 'https://example.com/evidence' }],
  ['activity-without-evidence', { id: 'activity-without-evidence', evidenceUrl: null }],
]);

let updatedData;
let updateCalls;
let server;
let baseUrl;

const taskRepository = {
  findUnique: async ({ where }) => activities.get(where.id) ?? null,
  update: async ({ where, data }) => {
    const existingActivity = activities.get(where.id);
    if (!existingActivity) {
      throw { code: 'P2025' };
    }

    updatedData = data;
    updateCalls += 1;
    return {
      ...existingActivity,
      title: 'Actividad de prueba',
      description: null,
      status: data.status,
      priority: 'MEDIA',
      dueDate: new Date('2026-07-30T18:00:00.000Z'),
      assigneeId: null,
      assignee: null,
      comments: [],
      subtasks: [],
      createdAt: new Date('2026-07-17T12:00:00.000Z'),
      updatedAt: new Date('2026-07-22T12:00:00.000Z'),
    };
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
      taskRepository,
    },
  });

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  updatedData = undefined;
  updateCalls = 0;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('PATCH /activities/:id/status', () => {
  function updateStatus(id, body, authToken = token) {
    return fetch(`${baseUrl}/activities/${id}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  it('acepta los estados permitidos y actualiza únicamente status', async () => {
    const allowedStatuses = [
      ['Pendiente', 'PENDIENTE'],
      ['En proceso', 'EN_PROCESO'],
      ['En revisión', 'EN_REVISION'],
    ];

    for (const [input, expected] of allowedStatuses) {
      const response = await updateStatus('activity-without-evidence', { status: input });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.status, expected);
      assert.deepEqual(updatedData, { status: expected });
    }
  });

  it('permite completar una actividad que tiene evidencia registrada', async () => {
    const response = await updateStatus('activity-with-evidence', { status: 'Completada' });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'COMPLETADA');
    assert.deepEqual(updatedData, { status: 'COMPLETADA' });
  });

  it('aplica RN-04 y rechaza completar una actividad sin evidencia', async () => {
    const response = await updateStatus('activity-without-evidence', { status: 'COMPLETADA' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'No se puede completar una actividad sin evidencia registrada',
    });
    assert.equal(updateCalls, 0);
  });

  it('retorna 400 si el estado no es válido', async () => {
    const response = await updateStatus('activity-with-evidence', { status: 'BLOQUEADA' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'El estado debe ser PENDIENTE, EN_PROCESO, EN_REVISION o COMPLETADA',
    });
    assert.equal(updateCalls, 0);
  });

  it('rechaza campos adicionales o la ausencia de status', async () => {
    const extraField = await updateStatus('activity-with-evidence', {
      status: 'PENDIENTE',
      title: 'No debe actualizarse',
    });
    const missingStatus = await updateStatus('activity-with-evidence', {});

    assert.equal(extraField.status, 400);
    assert.equal(missingStatus.status, 400);
    assert.equal(updateCalls, 0);
  });

  it('retorna 404 si la actividad no existe', async () => {
    const response = await updateStatus('missing-activity', { status: 'EN_PROCESO' });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Actividad no encontrada' });
  });

  it('retorna 401 si falta el token JWT', async () => {
    const response = await updateStatus('activity-with-evidence', { status: 'PENDIENTE' }, null);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Token de autenticación requerido' });
  });
});
