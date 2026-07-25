import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const activities = new Set(['activity-1']);

let updatedData;
let updateCalls;
let server;
let baseUrl;

const taskRepository = {
  update: async ({ where, data }) => {
    if (!activities.has(where.id)) {
      throw { code: 'P2025' };
    }

    updatedData = data;
    updateCalls += 1;
    return {
      id: where.id,
      title: 'Actividad de prueba',
      description: null,
      status: 'EN_REVISION',
      priority: 'MEDIA',
      dueDate: new Date('2026-07-30T18:00:00.000Z'),
      evidenceUrl: data.evidenceUrl,
      assigneeId: null,
      assignee: null,
      comments: [],
      subtasks: [],
      createdAt: new Date('2026-07-17T12:00:00.000Z'),
      updatedAt: new Date('2026-07-24T12:00:00.000Z'),
    };
  },
};

function createToken(role) {
  return jwt.sign(
    { sub: `${role.toLowerCase()}-1`, name: 'Usuario', email: `${role.toLowerCase()}@planify.test`, role },
    JWT_SECRET,
    { expiresIn: '24h', jwtid: randomUUID() },
  );
}

const memberToken = createToken('MIEMBRO_EQUIPO');
const observerToken = createToken('OBSERVADOR');

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

describe('PATCH /activities/:id/evidence', () => {
  function updateEvidence(id, body, authToken = memberToken) {
    return fetch(`${baseUrl}/activities/${id}/evidence`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  it('actualiza evidenceUrl y retorna la actividad con 200', async () => {
    const response = await updateEvidence('activity-1', {
      evidenceUrl: '  https://github.com/planify/evidencia  ',
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.evidenceUrl, 'https://github.com/planify/evidencia');
    assert.deepEqual(updatedData, {
      evidenceUrl: 'https://github.com/planify/evidencia',
    });
  });

  it('acepta enlaces HTTP y HTTPS de plataformas externas', async () => {
    const urls = [
      'https://drive.google.com/file/d/example',
      'https://www.youtube.com/watch?v=example',
      'http://example.com/evidencia',
    ];

    for (const evidenceUrl of urls) {
      const response = await updateEvidence('activity-1', { evidenceUrl });
      assert.equal(response.status, 200);
    }
  });

  it('retorna 400 para URLs inválidas o protocolos no permitidos', async () => {
    const invalidUrls = [
      '',
      'github.com/planify/evidencia',
      'ftp://example.com/evidencia',
      'https://',
      null,
    ];

    for (const evidenceUrl of invalidUrls) {
      const response = await updateEvidence('activity-1', { evidenceUrl });
      assert.equal(response.status, 400);
    }
    assert.equal(updateCalls, 0);
  });

  it('rechaza campos adicionales o la ausencia de evidenceUrl', async () => {
    const extraField = await updateEvidence('activity-1', {
      evidenceUrl: 'https://example.com/evidencia',
      status: 'COMPLETADA',
    });
    const missingEvidence = await updateEvidence('activity-1', {});

    assert.equal(extraField.status, 400);
    assert.equal(missingEvidence.status, 400);
    assert.equal(updateCalls, 0);
  });

  it('retorna 403 cuando un observador intenta modificar la evidencia', async () => {
    const response = await updateEvidence(
      'activity-1',
      { evidenceUrl: 'https://example.com/evidencia' },
      observerToken,
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      message: 'Solo los miembros del equipo pueden modificar la evidencia',
    });
    assert.equal(updateCalls, 0);
  });

  it('retorna 404 si la actividad no existe', async () => {
    const response = await updateEvidence('missing-activity', {
      evidenceUrl: 'https://example.com/evidencia',
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Actividad no encontrada' });
  });

  it('retorna 401 si falta el token JWT', async () => {
    const response = await updateEvidence(
      'activity-1',
      { evidenceUrl: 'https://example.com/evidencia' },
      null,
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Token de autenticación requerido' });
  });
});
