import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const activities = new Set(['activity-1', 'activity-race']);

let repositoryCalls;
let server;
let baseUrl;

const taskRepository = {
  findUnique: async ({ where }) => {
    repositoryCalls.push(`find:${where.id}`);
    return activities.has(where.id) ? { id: where.id } : null;
  },
  delete: async ({ where }) => {
    repositoryCalls.push(`delete:${where.id}`);

    if (where.id === 'activity-race') {
      const error = new Error('La actividad fue eliminada por otra petición');
      error.code = 'P2025';
      throw error;
    }

    activities.delete(where.id);
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
  activities.add('activity-1');
  activities.add('activity-race');
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('DELETE /activities/:id', () => {
  function deleteActivity(id, authToken = memberToken) {
    return fetch(`${baseUrl}/activities/${id}`, {
      method: 'DELETE',
      headers: authToken ? { authorization: `Bearer ${authToken}` } : {},
    });
  }

  it('valida la existencia, elimina la actividad y retorna 204 sin contenido', async () => {
    const response = await deleteActivity('activity-1');

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.deepEqual(repositoryCalls, ['find:activity-1', 'delete:activity-1']);
    assert.equal(activities.has('activity-1'), false);
  });

  it('retorna 404 y no elimina cuando la actividad no existe', async () => {
    const response = await deleteActivity('missing-activity');

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Actividad no encontrada' });
    assert.deepEqual(repositoryCalls, ['find:missing-activity']);
  });

  it('retorna 404 si la actividad desaparece entre la validación y el borrado', async () => {
    const response = await deleteActivity('activity-race');

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Actividad no encontrada' });
    assert.deepEqual(repositoryCalls, ['find:activity-race', 'delete:activity-race']);
  });

  it('rechaza a observadores en el middleware antes de consultar la actividad', async () => {
    const response = await deleteActivity('activity-1', observerToken);

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      message: 'Solo los miembros del equipo pueden realizar acciones de escritura',
    });
    assert.deepEqual(repositoryCalls, []);
  });

  it('retorna 401 si falta el token JWT', async () => {
    const response = await deleteActivity('activity-1', null);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Token de autenticación requerido' });
    assert.deepEqual(repositoryCalls, []);
  });
});
