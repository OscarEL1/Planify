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
