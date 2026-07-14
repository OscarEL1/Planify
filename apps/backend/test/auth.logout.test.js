import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
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

describe('POST /auth/logout', () => {
  function createToken(options = {}) {
    return jwt.sign(
      { sub: 'user-1', email: 'ada@planify.test', role: 'MIEMBRO_EQUIPO' },
      JWT_SECRET,
      { expiresIn: '24h', jwtid: randomUUID(), ...options },
    );
  }

  function logout(token) {
    return fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  }

  it('invalida un JWT activo y confirma el cierre de sesión', async () => {
    const token = createToken();
    const response = await logout(token);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Sesión cerrada correctamente' });
    assert.equal(tokenBlacklist.isRevoked(token), true);
  });

  it('rechaza el token después del logout en una ruta protegida', async () => {
    const token = createToken();

    assert.equal((await logout(token)).status, 200);

    const responseAfterLogout = await logout(token);
    assert.equal(responseAfterLogout.status, 401);
    assert.deepEqual(await responseAfterLogout.json(), {
      message: 'Token inválido o expirado',
    });
  });

  it('rechaza peticiones sin Bearer token', async () => {
    const response = await logout();

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: 'Token de autenticación requerido',
    });
  });

  it('rechaza tokens inválidos o expirados', async () => {
    const invalidResponse = await logout('not-a-jwt');
    assert.equal(invalidResponse.status, 401);

    const expiredToken = createToken({ expiresIn: -1 });
    const expiredResponse = await logout(expiredToken);
    assert.equal(expiredResponse.status, 401);
  });
});
