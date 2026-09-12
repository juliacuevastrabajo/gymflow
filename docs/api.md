# API REST

La API utiliza JSON y se sirve bajo `/api`. Salvo los endpoints indicados como públicos, las peticiones requieren:

```http
Authorization: Bearer <token>
```

## Autenticación

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Público |
| `GET` | `/api/auth/me` | Sesión activa |

## Usuarios y gimnasio

- `/api/usuarios`: altas, consulta y desactivación controladas por rol.
- `/api/usuarios/me`: edición del perfil propio.
- `/api/usuarios/me/password`: cambio seguro de contraseña.
- `/api/gimnasios/me`: configuración limitada del gimnasio autenticado.

## Clases y reservas

- `/api/clases`: sesiones concretas disponibles para el gimnasio.
- `/api/clases/programaciones`: reglas semanales administradas por el centro.
- `/api/reservas/me`: reservas del cliente autenticado.
- `/api/reservas`: gestión según los permisos del rol.
- `/api/reservas/{id}/cancelar`: cancelación validada por identidad y fecha.

## Rutinas

- `/api/rutinas`: planes de entrenamiento.
- `/api/rutinas/ejercicios`: biblioteca del gimnasio.
- `/api/rutinas/{id}/ejercicios`: composición y orden del plan.
- `/api/rutinas/{id}/asignaciones`: asignación a clientes.
- `/api/rutinas/me/asignadas`: rutinas del cliente autenticado.

## Pagos

- `/api/pagos`: administración de cobros.
- `/api/pagos/me`: pagos del cliente autenticado.
- `/api/pagos/{id}/marcar-pagado`: registro del pago.
- `/api/pagos/{id}/cancelar`: cancelación administrativa.

## Mensajes

- `/api/mensajes`: creación y gestión de comunicados.
- `/api/mensajes/me`: bandeja del usuario autenticado.
- `/api/mensajes/{id}/leer`: confirmación de lectura.
- `/api/mensajes/{id}/pausar` y `/reanudar`: control de automatizaciones.

## Invitaciones

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/api/invitaciones-clientes` | Administrador |
| `GET` | `/api/invitaciones-clientes` | Administrador |
| `POST` | `/api/invitaciones-clientes/{id}/revocar` | Administrador |
| `GET` | `/api/invitaciones-clientes/validar?token=...` | Público con token firmado |
| `POST` | `/api/invitaciones-clientes/registrar` | Público con token firmado |

## Archivos

- `/api/archivos/imagenes`: imágenes asociables a perfiles, gimnasio o clases.
- `/api/archivos/multimedia`: multimedia de ejercicios.
- `/uploads/**`: lectura `GET`/`HEAD`; las escrituras directas se rechazan.

Los errores de validación o reglas del dominio se representan mediante códigos `400`/`409`; la falta de sesión mediante `401` y los permisos insuficientes mediante `403`.
