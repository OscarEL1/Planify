import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const activities = new Set(['activity-1']);

let repositoryCalls;
let server;
let baseUrl;

const taskRepository = {
  findMany: async () => {
    repositoryCalls.push('findMany');
    return [];
  },
  findUnique: async ({ where }) => {
    repositoryCalls.push(`findUnique:${where.id}`);
    return activities.has(where.id) ? { id: where.id } : null;
  },
  delete: async ({ where }) => {
    repositoryCalls.push(`delete:${where.id}`);
    return { id: where.id };
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
const tokenWithoutRole = jwt.sign(
  { sub: 'user-without-role', name: 'Usuario', email: 'user@planify.test' },
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
  repositoryCalls = [];
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('middleware global de control de escritura', () => {
  function request(path, { method = 'GET', token = observerToken, body } = {}) {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  it('permite rutas GET a miembros y observadores', async () => {
    const observerResponse = await request('/activities');
    const memberResponse = await request('/activities', { token: memberToken });

    assert.equal(observerResponse.status, 200);
    assert.equal(memberResponse.status, 200);
    assert.deepEqual(repositoryCalls, ['findMany', 'findMany']);
  });

  it('bloquea globalmente POST, PATCH y DELETE para observadores', async () => {
    const requests = [
      request('/activities', { method: 'POST', body: {} }),
      request('/activities/activity-1', { method: 'PATCH', body: {} }),
      request('/activities/activity-1/status', { method: 'PATCH', body: { status: 'PENDIENTE' } }),
      request('/activities/activity-1/evidence', { method: 'PATCH', body: { evidenceUrl: 'https://example.com' } }),
      request('/activities/activity-1/comments', { method: 'POST', body: { text: 'Comentario' } }),
      request('/activities/activity-1', { method: 'DELETE' }),
    ];

    const responses = await Promise.all(requests);
    for (const response of responses) {
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        message: 'Solo los miembros del equipo pueden realizar acciones de escritura',
      });
    }
    assert.deepEqual(repositoryCalls, []);
  });

  it('permite las escrituras a miembros', async () => {
    const response = await request('/activities/activity-1', {
      method: 'DELETE',
      token: memberToken,
    });

    assert.equal(response.status, 204);
    assert.deepEqual(repositoryCalls, ['findUnique:activity-1', 'delete:activity-1']);
  });

  it('bloquea tokens autenticados que no incluyen role', async () => {
    const response = await request('/activities/activity-1', {
      method: 'DELETE',
      token: tokenWithoutRole,
    });

    assert.equal(response.status, 403);
    assert.deepEqual(repositoryCalls, []);
  });

  it('mantiene el 401 para peticiones sin JWT', async () => {
    const response = await request('/activities/activity-1', {
      method: 'DELETE',
      token: null,
    });

    assert.equal(response.status, 401);
    assert.deepEqual(repositoryCalls, []);
  });
});
