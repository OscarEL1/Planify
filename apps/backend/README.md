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

## PATCH /activities/:id

Actualiza parcialmente una actividad existente. Requiere autenticación Bearer y
acepta los mismos nombres usados por el formulario del frontend:

```bash
curl -X PATCH http://localhost:3000/activities/<activity-uuid> \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Presentación final","status":"EN_PROCESO","priority":"ALTA"}'
```

Los campos admitidos son `title`, `description`, `assigneeId`, `priority`,
`dueDate`, `status` y `evidenceUrl`. Todos son opcionales, pero debe enviarse al
menos uno. `description`, `assigneeId`, `dueDate` y `evidenceUrl` pueden enviarse
como `null` para limpiarlos. Un `assigneeId` no nulo debe pertenecer a un usuario
con rol `MIEMBRO_EQUIPO`. `subtasks` no se persiste porque todavía no existe en
el modelo de datos.

La respuesta `200` es directamente la actividad actualizada, tal como la espera
el servicio del frontend. Un ID inexistente retorna `404`, datos inválidos
retornan `400` y un token ausente, inválido o revocado retorna `401`. Prisma
actualiza automáticamente `updatedAt` mediante el atributo `@updatedAt`.

## PATCH /activities/:id/status

Actualiza exclusivamente el estado de una actividad. Requiere autenticación
Bearer y el body debe contener únicamente el campo `status`:

```bash
curl -X PATCH http://localhost:3000/activities/<activity-uuid>/status \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"status":"EN_PROCESO"}'
```

Los estados permitidos son `PENDIENTE`, `EN_PROCESO`, `EN_REVISION` y
`COMPLETADA`. También se aceptan sus etiquetas en español, sin importar
mayúsculas o acentos. La regla RN-04 impide cambiar a `COMPLETADA` cuando la
actividad no tiene `evidenceUrl`.

La respuesta exitosa usa código `200` y retorna directamente la actividad
actualizada. Un estado inválido, campos adicionales o el incumplimiento de RN-04
retornan `400`; un ID inexistente retorna `404`.

## PATCH /activities/:id/evidence

Actualiza exclusivamente el enlace de evidencia de una actividad. Requiere un
Bearer token perteneciente a un usuario con rol `MIEMBRO_EQUIPO`, y el body debe
contener únicamente `evidenceUrl`:

```bash
curl -X PATCH http://localhost:3000/activities/<activity-uuid>/evidence \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"evidenceUrl":"https://github.com/organizacion/repositorio"}'
```

El enlace debe ser una URL válida con protocolo HTTP o HTTPS. La respuesta
exitosa usa código `200` y retorna directamente la actividad actualizada. Una URL
inválida o campos adicionales retornan `400`; un observador recibe `403` y un ID
inexistente retorna `404`.

## DELETE /activities/:id

Elimina permanentemente una actividad. Requiere un Bearer token perteneciente a
un usuario con rol `MIEMBRO_EQUIPO`:

```bash
curl -X DELETE http://localhost:3000/activities/<activity-uuid> \
  -H "Authorization: Bearer <jwt>"
```

La eliminación de comentarios y subtareas relacionadas se realiza mediante las
restricciones `ON DELETE CASCADE` de la base de datos. `evidenceUrl` forma parte
de la propia actividad y se elimina junto con ella. Una eliminación exitosa
retorna `204` sin contenido; un ID inexistente retorna `404` y un observador
recibe `403`.

## POST /activities/:id/comments

Publica un comentario permanente en una actividad. Requiere un Bearer token de
un usuario con rol `MIEMBRO_EQUIPO`; el autor se obtiene del JWT y no del body:

```bash
curl -X POST http://localhost:3000/activities/<activity-uuid>/comments \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Se completó la primera revisión"}'
```

La respuesta `201` incluye el texto, `createdAt` y el usuario autor con su
nombre. Un comentario vacío retorna `400`, una actividad inexistente retorna
`404` y un observador recibe `403`.

## GET /activities/:id/comments

Retorna con código `200` todos los comentarios de la actividad, ordenados por
`createdAt` ascendente. Cada elemento incluye el texto, fecha de publicación y
el nombre del autor en `user.name`. Requiere autenticación, pero está disponible
tanto para miembros como para observadores. No existe endpoint DELETE de
comentarios: son permanentes por diseño (RN-08).

## GET /activities/stats

Retorna indicadores calculados en cada petición a partir de las actividades
actuales. Requiere autenticación y está disponible para miembros y observadores:

```bash
curl http://localhost:3000/activities/stats \
  -H "Authorization: Bearer <jwt>"
```

La respuesta usa el siguiente formato:

```json
{
  "byStatus": {
    "PENDIENTE": 2,
    "EN_PROCESO": 1,
    "EN_REVISION": 1,
    "COMPLETADA": 2
  },
  "total": 6,
  "completionPercentage": 33,
  "progressByAssignee": [
    {
      "assigneeId": "user-uuid",
      "name": "Ada Lovelace",
      "completed": 1,
      "total": 2,
      "completionPercentage": 50
    }
  ]
}
```

Las actividades sin responsable se incluyen en `total` y `byStatus`, pero no en
`progressByAssignee`. Los porcentajes se redondean al entero más cercano.

## Control de rol para escrituras

Todas las rutas de negocio bajo `/activities` requieren autenticación. Un
middleware transversal permite los métodos GET tanto a `MIEMBRO_EQUIPO` como a
`OBSERVADOR`, pero restringe POST, PATCH y DELETE a `MIEMBRO_EQUIPO`. Un intento
de escritura sin el rol requerido retorna `403`:

```json
{
  "message": "Solo los miembros del equipo pueden realizar acciones de escritura"
}
```

Los endpoints POST de `/auth` no forman parte de esta restricción: login,
registro y logout deben permanecer disponibles para completar el ciclo de
autenticación. El token emitido por login incluye el campo `role` en su payload.
