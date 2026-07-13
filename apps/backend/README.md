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
