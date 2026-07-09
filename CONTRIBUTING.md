# Guía de Contribución para Planify 🤝

Para mantener el historial limpio y profesional durante el desarrollo del Sprint Six, este repositorio usa **Husky** y **Commitlint**. No se permitirán commits que no sigan la estructura convencional.

## 📝 Estructura de un Commit

```text
tipo(alcance): descripción en minúsculas
```

### Tipos permitidos (`tipo`)
- `feat`: Nueva característica o funcionalidad (ej. nueva vista, nuevo endpoint).
- `fix`: Corrección de un bug o error.
- `docs`: Cambios en la documentación (README, comentarios).
- `style`: Cambios de formato (espacios, punto y coma) que no afectan la lógica del código.
- `refactor`: Refactorización de código sin agregar funciones ni corregir bugs.
- `test`: Agregar o corregir pruebas.
- `chore`: Tareas de mantenimiento, actualización de dependencias o configuración del repositorio.
- `ci`: Cambios en archivos de configuración de integración continua.

### Alcances permitidos (`scope`)
El alcance es obligatorio y debe indicar la parte del proyecto afectada:
`auth`, `activities`, `kanban`, `panel`, `comments`, `evidence`, `roles`, `ui`, `db`, `api`, `setup`, `deps`, `docs`, `ci`.

### ✅ Ejemplos válidos
- `feat(auth): agregar inicio de sesion con JWT`
- `fix(ui): centrar boton de guardar en modal`
- `chore(deps): actualizar dependencias de react en frontend`
- `feat(db): crear tabla de comentarios`

### ❌ Ejemplos inválidos (Husky bloqueará estos commits)
- `agregue el login` *(No tiene tipo ni alcance)*
- `Fix de la base de datos` *(Usa mayúsculas y no tiene estructura)*
- `feat: modal` *(Falta especificar el alcance entre paréntesis)*