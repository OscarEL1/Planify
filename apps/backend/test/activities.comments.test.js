import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();
const activities = new Set(['activity-1']);
const users = new Map([
  ['member-1', { id: 'member-1', name: 'Ada Lovelace' }],
  ['observer-1', { id: 'observer-1', name: 'Grace Hopper' }],
]);

const storedComments = [
  {
    id: 'comment-2',
    text: 'Segundo comentario',
    taskId: 'activity-1',
    userId: 'member-1',
    createdAt: new Date('2026-08-01T16:30:00.000Z'),
    user: users.get('member-1'),
  },
  {
    id: 'comment-1',
    text: 'Primer comentario',
    taskId: 'activity-1',
    userId: 'observer-1',
    createdAt: new Date('2026-08-01T15:00:00.000Z'),
    user: users.get('observer-1'),
  },
];

let createdData;
let findManyOptions;
let server;
let baseUrl;

const taskRepository = {
  findUnique: async ({ where }) => activities.has(where.id) ? { id: where.id } : null,
};

const commentRepository = {
  create: async ({ data }) => {
    createdData = data;
    return {
      id: 'comment-new',
      ...data,
      createdAt: new Date('2026-08-01T18:00:00.000Z'),
      user: users.get(data.userId),
    };
  },
  findMany: async (options) => {
    findManyOptions = options;
    return storedComments
      .filter((comment) => comment.taskId === options.where.taskId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },
};

function createToken({ id, name, role }) {
  return jwt.sign(
    { sub: id, name, email: `${id}@planify.test`, role },
    JWT_SECRET,
    { expiresIn: '24h', jwtid: randomUUID() },
  );
}

const memberToken = createToken({ id: 'member-1', name: 'Ada Lovelace', role: 'MIEMBRO_EQUIPO' });
const observerToken = createToken({ id: 'observer-1', name: 'Grace Hopper', role: 'OBSERVADOR' });

before(async () => {
  const app = createApp({
    activityDependencies: {
      jwtSecret: JWT_SECRET,
      tokenBlacklist,
      taskRepository,
      commentRepository,
    },
  });

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  createdData = undefined;
  findManyOptions = undefined;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('comentarios de actividades', () => {
  function requestComments(activityId, { method = 'GET', body, token = memberToken } = {}) {
    return fetch(`${baseUrl}/activities/${activityId}/comments`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  it('POST asocia el texto con la actividad y el autor autenticado', async () => {
    const response = await requestComments('activity-1', {
      method: 'POST',
      body: { text: '  Seguimiento del miembro  ', userId: 'observer-1' },
    });
    const comment = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(createdData, {
      text: 'Seguimiento del miembro',
      taskId: 'activity-1',
      userId: 'member-1',
    });
    assert.equal(comment.text, 'Seguimiento del miembro');
    assert.equal(comment.user.name, 'Ada Lovelace');
    assert.equal(comment.createdAt, '2026-08-01T18:00:00.000Z');
  });

  it('GET retorna los comentarios con autor y fecha en orden cronológico', async () => {
    const response = await requestComments('activity-1', { token: observerToken });
    const comments = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(comments.map((comment) => comment.id), ['comment-1', 'comment-2']);
    assert.equal(comments[0].user.name, 'Grace Hopper');
    assert.equal(comments[0].createdAt, '2026-08-01T15:00:00.000Z');
    assert.deepEqual(findManyOptions.orderBy, { createdAt: 'asc' });
  });

  it('POST rechaza comentarios vacíos', async () => {
    const response = await requestComments('activity-1', {
      method: 'POST',
      body: { text: '   ' },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message: 'El comentario no puede estar vacío' });
    assert.equal(createdData, undefined);
  });

  it('POST rechaza observadores antes de consultar o guardar datos', async () => {
    const response = await requestComments('activity-1', {
      method: 'POST',
      body: { text: 'Comentario no permitido' },
      token: observerToken,
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      message: 'Solo los miembros del equipo pueden realizar acciones de escritura',
    });
    assert.equal(createdData, undefined);
  });

  it('GET y POST retornan 404 para una actividad inexistente', async () => {
    const getResponse = await requestComments('missing-activity');
    const postResponse = await requestComments('missing-activity', {
      method: 'POST',
      body: { text: 'Comentario' },
    });

    assert.equal(getResponse.status, 404);
    assert.equal(postResponse.status, 404);
  });

  it('GET y POST requieren autenticación', async () => {
    const getResponse = await requestComments('activity-1', { token: null });
    const postResponse = await requestComments('activity-1', {
      method: 'POST',
      body: { text: 'Comentario' },
      token: null,
    });

    assert.equal(getResponse.status, 401);
    assert.equal(postResponse.status, 401);
  });

  it('no expone un endpoint DELETE para comentarios', async () => {
    const response = await fetch(`${baseUrl}/activities/activity-1/comments/comment-1`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${memberToken}` },
    });

    assert.equal(response.status, 404);
  });
});
