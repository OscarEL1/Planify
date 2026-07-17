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
const observer = {
  id: 'observer-1',
  name: 'Grace Hopper',
  email: 'grace@planify.test',
  role: 'OBSERVADOR',
};

let createdData;
let server;
let baseUrl;

const userRepository = {
  findUnique: async ({ where }) => {
    if (where.id === teamMember.id) return teamMember;
    if (where.id === observer.id) return observer;
    return null;
  },
};

const taskRepository = {
  create: async ({ data }) => {
    createdData = data;
    return {
      id: 'activity-1',
      ...data,
      assignee: teamMember,
      comments: [],
      createdAt: new Date('2026-07-17T12:00:00.000Z'),
      updatedAt: new Date('2026-07-17T12:00:00.000Z'),
    };
  },
};

const token = jwt.sign(
  { sub: 'creator-1', name: 'Creator', email: 'creator@planify.test', role: 'MIEMBRO_EQUIPO' },
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

describe('POST /activities', () => {
  function createActivity(body, authToken = token) {
    return fetch(`${baseUrl}/activities`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  const validActivity = {
    title: 'Preparar presentación',
    description: 'Preparar las diapositivas del proyecto',
    assigneeId: teamMember.id,
    priority: 'alta',
    dueDate: '2026-07-30T18:00:00.000Z',
    status: 'COMPLETADA',
    evidenceUrl: 'https://example.com/evidencia',
    comments: [{ text: 'Este comentario debe ignorarse' }],
  };

  it('crea una actividad pendiente y retorna 201 con su ID', async () => {
    const response = await createActivity(validActivity);
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.message, 'Actividad creada correctamente');
    assert.equal(body.activity.id, 'activity-1');
    assert.equal(body.activity.status, 'PENDIENTE');
    assert.equal(body.activity.priority, 'ALTA');
    assert.deepEqual(body.activity.assignee, teamMember);
    assert.deepEqual(body.activity.comments, []);
    assert.equal(createdData.status, 'PENDIENTE');
    assert.equal(createdData.comments, undefined);
  });

  it('retorna 400 si el título está vacío', async () => {
    const response = await createActivity({ ...validActivity, title: '   ' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message: 'El título es obligatorio' });
  });

  it('retorna 400 si el responsable no existe', async () => {
    const response = await createActivity({ ...validActivity, assigneeId: 'missing-user' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'El responsable debe ser un miembro del equipo registrado',
    });
  });

  it('retorna 400 si el responsable es observador', async () => {
    const response = await createActivity({ ...validActivity, assigneeId: observer.id });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'El responsable debe ser un miembro del equipo registrado',
    });
  });

  it('retorna 400 para prioridad o fecha límite inválidas', async () => {
    const priorityResponse = await createActivity({ ...validActivity, priority: 'URGENTE' });
    assert.equal(priorityResponse.status, 400);

    const dateResponse = await createActivity({ ...validActivity, dueDate: 'not-a-date' });
    assert.equal(dateResponse.status, 400);
  });

  it('retorna 401 si falta el token JWT', async () => {
    const response = await createActivity(validActivity, null);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: 'Token de autenticación requerido',
    });
  });
});
