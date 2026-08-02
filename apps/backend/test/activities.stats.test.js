import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();

const ada = { id: 'member-1', name: 'Ada Lovelace' };
const grace = { id: 'member-2', name: 'Grace Hopper' };

let currentActivities;
let findManyCalls;
let server;
let baseUrl;

const initialActivities = [
  { status: 'PENDIENTE', assignee: ada },
  { status: 'COMPLETADA', assignee: ada },
  { status: 'EN_PROCESO', assignee: grace },
  { status: 'EN_REVISION', assignee: grace },
  { status: 'COMPLETADA', assignee: grace },
  { status: 'PENDIENTE', assignee: null },
];

const taskRepository = {
  findMany: async () => {
    findManyCalls += 1;
    return currentActivities;
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
  currentActivities = initialActivities.map((activity) => ({ ...activity }));
  findManyCalls = 0;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('GET /activities/stats', () => {
  function getStats(token = memberToken) {
    return fetch(`${baseUrl}/activities/stats`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  }

  it('retorna conteos, total y porcentaje de completado', async () => {
    const response = await getStats();
    const stats = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(stats.byStatus, {
      PENDIENTE: 2,
      EN_PROCESO: 1,
      EN_REVISION: 1,
      COMPLETADA: 2,
    });
    assert.equal(stats.total, 6);
    assert.equal(stats.completionPercentage, 33);
  });

  it('retorna el progreso por responsable y excluye actividades sin asignar', async () => {
    const response = await getStats();
    const { progressByAssignee } = await response.json();

    assert.deepEqual(progressByAssignee, [
      {
        assigneeId: 'member-1',
        name: 'Ada Lovelace',
        completed: 1,
        total: 2,
        completionPercentage: 50,
      },
      {
        assigneeId: 'member-2',
        name: 'Grace Hopper',
        completed: 1,
        total: 3,
        completionPercentage: 33,
      },
    ]);
  });

  it('calcula cada respuesta con las actividades actuales', async () => {
    const firstResponse = await getStats();
    assert.equal((await firstResponse.json()).total, 6);

    currentActivities = [
      ...currentActivities,
      { status: 'COMPLETADA', assignee: ada },
    ];

    const secondResponse = await getStats();
    const updatedStats = await secondResponse.json();

    assert.equal(updatedStats.total, 7);
    assert.equal(updatedStats.byStatus.COMPLETADA, 3);
    assert.equal(updatedStats.completionPercentage, 43);
    assert.equal(findManyCalls, 2);
  });

  it('retorna ceros y una lista vacía cuando no existen actividades', async () => {
    currentActivities = [];

    const response = await getStats();
    const stats = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(stats, {
      byStatus: {
        PENDIENTE: 0,
        EN_PROCESO: 0,
        EN_REVISION: 0,
        COMPLETADA: 0,
      },
      total: 0,
      completionPercentage: 0,
      progressByAssignee: [],
    });
  });

  it('permite el acceso a usuarios observadores', async () => {
    const response = await getStats(observerToken);

    assert.equal(response.status, 200);
  });

  it('requiere autenticación y no consulta actividades sin JWT', async () => {
    const response = await getStats(null);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Token de autenticación requerido' });
    assert.equal(findManyCalls, 0);
  });
});
