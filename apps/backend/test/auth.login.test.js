import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';

const JWT_SECRET = 'test-secret-not-for-production';
const storedUser = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@planify.test',
  password: await bcrypt.hash('correct-password', 4),
  role: 'MIEMBRO_EQUIPO',
};

let server;
let baseUrl;

before(async () => {
  const app = createApp({
    authDependencies: {
      userRepository: {
        findUnique: async ({ where }) => where.email === storedUser.email ? storedUser : null,
      },
      jwtSecret: JWT_SECRET,
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

describe('POST /auth/login', () => {
  async function login(body) {
    return fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('retorna un JWT válido por 24 horas con credenciales correctas', async () => {
    const response = await login({
      email: ' ADA@PLANIFY.TEST ',
      password: 'correct-password',
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.expiresIn, '24h');
    assert.equal(body.user.email, storedUser.email);
    assert.equal(body.user.password, undefined);

    const payload = jwt.verify(body.token, JWT_SECRET);
    assert.equal(payload.sub, storedUser.id);
    assert.equal(payload.email, storedUser.email);
    assert.equal(payload.role, 'MIEMBRO_EQUIPO');
    assert.equal(typeof payload.jti, 'string');
    assert.equal(payload.exp - payload.iat, 24 * 60 * 60);
  });

  it('retorna 401 si el correo no existe', async () => {
    const response = await login({ email: 'unknown@planify.test', password: 'anything' });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Correo o contraseña incorrectos' });
  });

  it('retorna 401 si la contraseña es incorrecta', async () => {
    const response = await login({ email: storedUser.email, password: 'wrong-password' });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Correo o contraseña incorrectos' });
  });

  it('retorna 400 si faltan credenciales', async () => {
    const response = await login({ email: storedUser.email });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'El correo y la contraseña son obligatorios',
    });
  });

  it('permite credenciales CORS desde el frontend configurado', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  });
});
