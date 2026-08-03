import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';

const users = new Map();
let createdUserData;
let server;
let baseUrl;

const userRepository = {
  findUnique: async ({ where }) => users.get(where.email) ?? null,
  create: async ({ data }) => {
    createdUserData = data;
    const user = {
      id: `user-${users.size + 1}`,
      name: data.name,
      email: data.email,
      role: data.role,
    };
    users.set(data.email, { ...user, password: data.password });
    return user;
  },
};

before(async () => {
  users.set('existing@planify.test', {
    id: 'existing-user',
    name: 'Existing User',
    email: 'existing@planify.test',
    password: 'hashed-password',
    role: 'MIEMBRO_EQUIPO',
  });

  const app = createApp({ authDependencies: { userRepository } });
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

describe('POST /auth/register', () => {
  function register(body) {
    return fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('crea un miembro con contraseña hasheada y retorna 201 sin el password', async () => {
    const response = await register({
      fullName: '  Grace Hopper  ',
      email: ' GRACE@PLANIFY.TEST ',
      password: 'secure-password',
      role: 'OBSERVADOR',
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.message, 'Usuario registrado correctamente');
    assert.deepEqual(body.user, {
      id: 'user-2',
      name: 'Grace Hopper',
      email: 'grace@planify.test',
      role: 'MIEMBRO_EQUIPO',
    });
    assert.equal(body.user.password, undefined);
    assert.equal(createdUserData.role, 'MIEMBRO_EQUIPO');
    assert.notEqual(createdUserData.password, 'secure-password');
    assert.equal(await bcrypt.compare('secure-password', createdUserData.password), true);
  });

  it('retorna 409 si el correo ya está registrado', async () => {
    const response = await register({
      fullName: 'Existing User',
      email: 'EXISTING@PLANIFY.TEST',
      password: 'secure-password',
    });

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { message: 'El correo ya está registrado' });
  });

  it('retorna 400 si la contraseña tiene menos de 8 caracteres', async () => {
    const response = await register({
      fullName: 'Short Password',
      email: 'short@planify.test',
      password: '1234567',
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'La contraseña debe tener al menos 8 caracteres',
    });
  });

  it('retorna 400 si faltan campos obligatorios', async () => {
    const response = await register({ email: 'missing@planify.test' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'El nombre, correo y contraseña son obligatorios',
    });
  });

  it('retorna 400 si el correo tiene formato inválido', async () => {
    const response = await register({
      fullName: 'Invalid Email',
      email: 'not-an-email',
      password: 'secure-password',
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      message: 'El correo no tiene un formato válido',
    });
  });
});
