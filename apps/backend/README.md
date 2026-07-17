# Planify Backend

## POST /auth/login

Autentica a un usuario mediante correo y contraseña. Una autenticación correcta
retorna un JWT con vigencia de 24 horas. Las credenciales incorrectas retornan
el mismo mensaje para no revelar si un correo está registrado.

### Variables de entorno

Copia `.env.example` como `.env` y configura `DATABASE_URL` y `JWT_SECRET`.
Para generar un secreto seguro en PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

### Petición

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"mi-contraseña"}'
```

Respuesta exitosa (`200`):

```json
{
  "token": "<jwt>",
  "expiresIn": "24h",
  "user": {
    "id": "<uuid>",
    "name": "Usuario",
    "email": "usuario@ejemplo.com",
    "role": "MIEMBRO_EQUIPO"
  }
}
```

Credenciales incorrectas (`401`):

```json
{ "message": "Correo o contraseña incorrectos" }
```

Correo o contraseña ausentes (`400`):

```json
{ "message": "El correo y la contraseña son obligatorios" }
```

## POST /auth/logout

Invalida inmediatamente el JWT de la sesión activa. El token debe enviarse en
el encabezado `Authorization` con el esquema Bearer:

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <jwt>"
```

Respuesta exitosa (`200`):

```json
{ "message": "Sesión cerrada correctamente" }
```

Si el token falta, es inválido, expiró o ya fue revocado, el endpoint responde
`401`. Por ejemplo, repetir la petición anterior con el mismo token retorna:

```json
{ "message": "Token inválido o expirado" }
```

La revocación usa una blacklist en memoria que conserva únicamente el hash
SHA-256 del token hasta su fecha de expiración. Por ello, la blacklist aplica a
una sola instancia y se pierde cuando el servidor se reinicia. Para múltiples
instancias o revocación persistente debe reemplazarse por un almacén compartido
como Redis o PostgreSQL.

## POST /auth/register

Crea un usuario con el rol `MIEMBRO_EQUIPO`. El rol no se acepta desde el
cliente y la contraseña se almacena únicamente como hash bcrypt.

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Grace Hopper","email":"grace@planify.test","password":"secure-password"}'
```

Respuesta exitosa (`201`):

```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": "<uuid>",
    "name": "Grace Hopper",
    "email": "grace@planify.test",
    "role": "MIEMBRO_EQUIPO"
  }
}
```

El correo duplicado retorna `409`:

```json
{ "message": "El correo ya está registrado" }
```

Campos ausentes, correo inválido o contraseña menor a ocho caracteres retornan
`400` con un mensaje que describe el error. La respuesta nunca incluye la
contraseña ni su hash.

## GET /auth/me

Retorna los datos incluidos en el JWT de la sesión autenticada. Requiere el
encabezado `Authorization` con esquema Bearer:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <jwt>"
```

Respuesta exitosa (`200`):

```json
{
  "id": "<uuid>",
  "name": "Grace Hopper",
  "email": "grace@planify.test",
  "role": "MIEMBRO_EQUIPO"
}
```

Si el token falta, es inválido, expiró o fue revocado, responde `401`. La
respuesta nunca incluye la contraseña.

## POST /activities

Crea una actividad asignada a un usuario con rol `MIEMBRO_EQUIPO`. Requiere
autenticación Bearer y siempre guarda el estado inicial como `PENDIENTE`, aunque
el cliente envíe otro valor.

```bash
curl -X POST http://localhost:3000/activities \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Preparar presentación","description":"Preparar diapositivas","assigneeId":"<user-uuid>","priority":"ALTA","dueDate":"2026-07-30T18:00:00.000Z","evidenceUrl":"https://example.com/evidencia"}'
```

Campos del contrato:

- `title`: obligatorio.
- `description`: opcional.
- `assigneeId`: UUID obligatorio de un usuario `MIEMBRO_EQUIPO`.
- `priority`: `ALTA`, `MEDIA` o `BAJA`.
- `dueDate`: fecha límite válida en formato ISO 8601.
- `evidenceUrl`: opcional.
- `status`: ignorado; siempre se establece como `PENDIENTE`.
- `comments`: ignorado en creación; la respuesta inicia con una lista vacía.

La respuesta exitosa usa código `201` y contiene `message` y `activity`, con el
ID generado, responsable, estado y timestamps. Los errores de validación usan
código `400`; un token ausente, inválido o revocado usa `401`.
