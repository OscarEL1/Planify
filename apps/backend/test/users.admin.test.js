import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { TokenBlacklist } from '../src/services/token-blacklist.js';

const JWT_SECRET = 'test-secret-not-for-production';
const tokenBlacklist = new TokenBlacklist();

const admin = { id: 'admin-1', name: 'Admin User', email: 'admin@planify.test', role: 'ADMIN' };
const member = { id: 'member-1', name: 'Member User', email: 'member@planify.test', role: 'MIEMBRO_EQUIPO' };
const observer = { id: 'observer-1', name: 'Observer User', email: 'observer@planify.test', role: 'OBSERVADOR' };

let server;
let baseUrl;

const users = [admin, member, observer];

const userRepository = {
  findUnique: async ({ where }) => users.find((u) => u.email === where.email || u.id === where.id) || null,
  findMany: async () => users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
  create: async ({ data }) => {
    const newUser = { id: randomUUID(), ...data };
    users.push(newUser);
    return newUser;
  },
  delete: async ({ where }) => {
    const idx = users.findIndex((u) => u.id === where.id);
    if (idx !== -1) users.splice(idx, 1);
    return { id: where.id };
  },
  update: async ({ where, data }) => {
    const user = users.find((u) => u.id === where.id);
    if (user) Object.assign(user, data);
    return { id: where.id, name: user?.name, email: user?.email, role: data.role || user?.role };
  },
};

const adminToken = jwt.sign(
  { sub: 'admin-1', name: 'Admin', email: 'admin@planify.test', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '24h', jwtid: randomUUID() },
);

const memberToken = jwt.sign(
  { sub: 'member-1', name: 'Member', email: 'member@planify.test', role: 'MIEMBRO_EQUIPO' },
  JWT_SECRET,
  { expiresIn: '24h', jwtid: randomUUID() },
);

const observerToken = jwt.sign(
  { sub: 'observer-1', name: 'Observer', email: 'observer@planify.test', role: 'OBSERVADOR' },
  JWT_SECRET,
  { expiresIn: '24h', jwtid: randomUUID() },
);

before(async () => {
  const app = createApp({
    activityDependencies: {
      jwtSecret: JWT_SECRET,
      tokenBlacklist,
      userRepository,
    },
    usersDependencies: {
      jwtSecret: JWT_SECRET,
      tokenBlacklist,
      userRepository,
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

describe('Gestión de usuarios — Admin', () => {
  function authRequest(method, path, body, token = adminToken) {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  describe('DELETE /users/:id', () => {
    it('admin puede eliminar un miembro', async () => {
      const response = await authRequest('DELETE', '/users/member-1', null, adminToken);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.message, 'Usuario eliminado correctamente');
    });

    it('admin no puede eliminarse a sí mismo', async () => {
      const response = await authRequest('DELETE', '/users/admin-1', null, adminToken);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.message, 'No puedes eliminarte a ti mismo');
    });

    it('miembro no puede eliminar usuarios', async () => {
      const response = await authRequest('DELETE', '/users/observer-1', null, memberToken);

      assert.equal(response.status, 403);
    });

    it('observador no puede eliminar usuarios', async () => {
      const response = await authRequest('DELETE', '/users/member-1', null, observerToken);

      assert.equal(response.status, 403);
    });
  });

  describe('POST /users', () => {
    it('admin puede crear un usuario', async () => {
      const response = await authRequest('POST', '/users', {
        name: 'New User',
        email: 'new@planify.test',
        role: 'MIEMBRO_EQUIPO',
      }, adminToken);
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.message, 'Usuario creado correctamente. Contraseña temporal: planify2026');
      assert.equal(body.user.name, 'New User');
      assert.equal(body.user.role, 'MIEMBRO_EQUIPO');
    });

    it('admin no puede crear usuario con email duplicado', async () => {
      const response = await authRequest('POST', '/users', {
        name: 'Duplicate',
        email: 'admin@planify.test',
        role: 'MIEMBRO_EQUIPO',
      }, adminToken);
      const body = await response.json();

      assert.equal(response.status, 409);
      assert.equal(body.message, 'El correo ya está registrado');
    });

    it('miembro no puede crear usuarios', async () => {
      const response = await authRequest('POST', '/users', {
        name: 'Test',
        email: 'test@planify.test',
        role: 'MIEMBRO_EQUIPO',
      }, memberToken);

      assert.equal(response.status, 403);
    });
  });

  describe('PATCH /users/:id/role', () => {
    it('admin puede cambiar el rol de un usuario', async () => {
      const response = await authRequest('PATCH', '/users/observer-1/role', {
        role: 'MIEMBRO_EQUIPO',
      }, adminToken);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.role, 'MIEMBRO_EQUIPO');
    });

    it('admin no puede cambiar su propio rol', async () => {
      const response = await authRequest('PATCH', '/users/admin-1/role', {
        role: 'OBSERVADOR',
      }, adminToken);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.message, 'No puedes cambiar tu propio rol');
    });

    it('rechaza rol inválido', async () => {
      const response = await authRequest('PATCH', '/users/observer-1/role', {
        role: 'INVALID_ROLE',
      }, adminToken);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.message, 'El rol debe ser ADMIN, MIEMBRO_EQUIPO u OBSERVADOR');
    });

    it('miembro no puede cambiar roles', async () => {
      const response = await authRequest('PATCH', '/users/observer-1/role', {
        role: 'OBSERVADOR',
      }, memberToken);

      assert.equal(response.status, 403);
    });
  });
});
