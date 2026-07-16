import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();

let server;
let baseUrl;

before(async () => {
  const app = createApp({
    authDependencies: {
      jwtSecret: JWT_SECRET,
      tokenBlacklist,
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

describe('GET /auth/me', () => {
  function createToken(payload = {}) {
    return jwt.sign(
      {
        sub: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@planify.test',
        role: 'MIEMBRO_EQUIPO',
        ...payload,
      },
      JWT_SECRET,
      { expiresIn: '24h', jwtid: randomUUID() },
    );
  }

  function getMe(token) {
    return fetch(`${baseUrl}/auth/me`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  }

  it('retorna los datos del usuario autenticado sin password', async () => {
    const response = await getMe(createToken());
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@planify.test',
      role: 'MIEMBRO_EQUIPO',
    });
    assert.equal(body.password, undefined);
  });

  it('retorna 401 si falta el token', async () => {
    const response = await getMe();

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: 'Token de autenticación requerido',
    });
  });

  it('retorna 401 si el token es inválido', async () => {
    const response = await getMe('not-a-valid-jwt');

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: 'Token inválido o expirado',
    });
  });

  it('retorna 401 si el token no contiene los datos requeridos', async () => {
    const response = await getMe(createToken({ name: '' }));

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: 'Token inválido o expirado',
    });
  });

  it('rechaza un token revocado mediante logout', async () => {
    const token = createToken();
    const logoutResponse = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(logoutResponse.status, 200);
    assert.equal((await getMe(token)).status, 401);
  });
});
