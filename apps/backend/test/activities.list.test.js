import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const teamMember = {
  id: 'member-1',
  name: 'Ada Lovelace',
  email: 'ada@planify.test',
  role: 'MIEMBRO_EQUIPO',
};

const activities = [
  { id: 'a1', title: 'Actividad Alta', priority: 'ALTA', assigneeId: 'member-1', status: 'PENDIENTE', createdAt: new Date('2026-07-01') },
  { id: 'a2', title: 'Actividad Media', priority: 'MEDIA', assigneeId: 'member-1', status: 'EN_PROCESO', createdAt: new Date('2026-07-02') },
  { id: 'a3', title: 'Actividad Baja', priority: 'BAJA', assigneeId: 'member-2', status: 'COMPLETADA', createdAt: new Date('2026-07-03') },
];

let server;
let baseUrl;

const userRepository = {
  findUnique: async ({ where }) => {
    if (where.id === teamMember.id) return teamMember;
    return null;
  },
};

const taskRepository = {
  findMany: async ({ where = {}, orderBy }) => {
    let result = [...activities];
    if (where.assigneeId) {
      result = result.filter((a) => a.assigneeId === where.assigneeId);
    }
    if (where.priority) {
      result = result.filter((a) => a.priority === where.priority);
    }
    return result.map((a) => ({
      ...a,
      assignee: teamMember,
      comments: [],
      subtasks: [],
    }));
  },
};

const token = jwt.sign(
  { sub: 'member-1', name: 'Ada', email: 'ada@planify.test', role: 'MIEMBRO_EQUIPO' },
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

describe('GET /activities — filtros', () => {
  function getActivities(queryParams = '') {
    const url = queryParams ? `${baseUrl}/activities?${queryParams}` : `${baseUrl}/activities`;
    return fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  it('retorna todas las actividades sin filtros', async () => {
    const response = await getActivities();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 3);
  });

  it('filtra por assigneeId', async () => {
    const response = await getActivities('assigneeId=member-1');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 2);
    assert.ok(body.every((a) => a.assigneeId === 'member-1'));
  });

  it('filtra por priority ALTA', async () => {
    const response = await getActivities('priority=ALTA');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].priority, 'ALTA');
  });

  it('filtra por priority MEDIA', async () => {
    const response = await getActivities('priority=MEDIA');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].priority, 'MEDIA');
  });

  it('filtra por priority BAJA', async () => {
    const response = await getActivities('priority=BAJA');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].priority, 'BAJA');
  });

  it('filtra por assigneeId y priority combinados', async () => {
    const response = await getActivities('assigneeId=member-1&priority=ALTA');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].id, 'a1');
  });

  it('retorna vacío si assigneeId no coincide', async () => {
    const response = await getActivities('assigneeId=nonexistent');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 0);
  });

  it('ignora priority inválida y retorna todas', async () => {
    const response = await getActivities('priority=CRITICA');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 3);
  });

  it('retorna vacío si ambos filtros no coinciden', async () => {
    const response = await getActivities('assigneeId=member-2&priority=ALTA');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 0);
  });

  it('assigneeId=all retorna todas', async () => {
    const response = await getActivities('assigneeId=all');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 3);
  });

  it('priority=all retorna todas', async () => {
    const response = await getActivities('priority=all');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 3);
  });
});
