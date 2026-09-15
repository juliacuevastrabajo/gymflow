<p align="center">
  <img src="mobile/assets/brand/gymflow-wordmark-color.svg" alt="GymFlow" width="320" />
</p>

<p align="center">
  Plataforma full stack para gestionar centros deportivos, coordinar al equipo y ofrecer una experiencia móvil cuidada a sus clientes.
</p>

## Sobre el desarrollo

GymFlow fue desarrollado como un proyecto de aprendizaje y experimentación utilizando de forma intensiva herramientas de IA generativa durante el proceso de implementación.

La definición del producto, sus funcionalidades, requisitos y decisiones de diseño se realizaron de forma iterativa, utilizando IA como herramienta de apoyo para generar, modificar y revisar parte del código.

Por este motivo, el repositorio representa también una experiencia práctica de desarrollo asistido por IA y no pretende atribuir la autoría manual de la totalidad del código.

<p align="center">
  <img alt="React Native" src="https://img.shields.io/badge/React_Native-0.81-20232A?logo=react" />
  <img alt="Expo" src="https://img.shields.io/badge/Expo-54-000020?logo=expo" />
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?logo=springboot&logoColor=white" />
  <img alt="Java" src="https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white" />
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-9-4479A1?logo=mysql&logoColor=white" />
</p>

## El producto

GymFlow centraliza la operativa diaria de un gimnasio: programación de clases, reservas, rutinas, pagos, comunicación, altas de usuarios y personalización del centro.

La aplicación adapta navegación, información y acciones a **administradores**, **entrenadores** y **clientes**. Detrás de la interfaz, la API conserva la autoridad sobre la identidad, los permisos y el aislamiento de datos de cada gimnasio.

El resultado es una primera versión funcional que combina diseño de producto móvil, modelado de dominio, persistencia, seguridad y pruebas automatizadas.

> Estado: primera versión funcional completada y en pausa planificada. Es un proyecto de porfolio, no un servicio desplegado en producción.

## Experiencia móvil

<p align="center">
  <img src="docs/screenshots/splash-screen.jpg" alt="Pantalla de carga de GymFlow" width="28%" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/login-screen.jpg" alt="Inicio de sesión e invitaciones de GymFlow" width="28%" />
</p>

<p align="center">
  <em>Identidad de producto, acceso por credenciales y entrada mediante invitación del gimnasio.</em>
</p>

<p align="center">
  <img src="docs/screenshots/admin-dashboard.jpg" alt="Vista previa del panel de administración" width="29%" />
  <img src="docs/screenshots/trainer-dashboard.jpg" alt="Vista previa del panel de entrenador" width="29%" />
  <img src="docs/screenshots/client-dashboard.jpg" alt="Vista previa del panel de cliente" width="29%" />
</p>

<p align="center">
  <em>Tres experiencias coherentes, con navegación y prioridades propias para cada rol.</em>
</p>

Las capturas utilizan datos de ejemplo y muestran únicamente la entrada y el punto de partida del producto. El resto de flujos se resume a continuación sin convertir el README en un recorrido completo por la aplicación.

## Funcionalidades destacadas

- Programación semanal de clases y materialización de sesiones con identificadores estables.
- Reservas con control de capacidad y protección ante solicitudes concurrentes por la última plaza.
- Rutinas, asignaciones, ejercicios multimedia y calculadora de repetición máxima (1RM).
- Pagos persistentes con estados pendiente, pagado, cancelado y vencido calculado.
- Mensajes, comunicados y automatizaciones dirigidas por audiencia.
- Alta manual de clientes y entrenadores, además de invitaciones de clientes mediante enlace o QR.
- Fotografías desde cámara o galería y sistema de archivos con validación de tipo y firma binaria.
- Identidad visual configurable y previsualizaciones neutrales de los tres roles.

## Arquitectura

```mermaid
flowchart LR
    A[App móvil\nExpo + React Native] -->|REST + Bearer token| B[API\nSpring Boot]
    B --> C[Servicios de dominio\ny autorización]
    C --> D[(MySQL)]
    C --> E[Archivos gestionados]
    F[Planificadores] --> C
    F --> G[Clases recurrentes\ny mensajes automáticos]
```

La identidad del usuario y su gimnasio se obtienen siempre de la sesión. Los servicios vuelven a validar rol, pertenencia y estado antes de consultar o modificar información.

Más información en [Arquitectura](docs/architecture.md), [API](docs/api.md) y [Decisiones técnicas](docs/technical-decisions.md).

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Aplicación | React Native, Expo Router, TypeScript |
| Backend | Java 17, Spring Boot, Spring MVC, Spring Data JPA |
| Datos | MySQL, H2 para pruebas |
| Seguridad | BCrypt, tokens HMAC, autorización por rol y gimnasio |
| Calidad | JUnit, Mockito, Node Test Runner, ESLint, TypeScript |

## Calidad y seguridad

- Suite backend con **158 pruebas automatizadas** tras la preparación pública.
- Pruebas específicas de autorización, aislamiento entre gimnasios, concurrencia y tareas programadas.
- Pruebas unitarias de calendario y cálculo 1RM en la aplicación.
- Contraseñas almacenadas únicamente como hash BCrypt.
- Secretos y direcciones del entorno fuera del código fuente.
- Subidas temporales, asociación controlada y limpieza automática de archivos abandonados.
- Validación continua mediante GitHub Actions.

## Ejecución local

### Requisitos

- Node.js 22 y npm.
- JDK 17.
- MySQL 8 o superior.

### Backend

Consulta [backend/README.md](backend/README.md) para crear la base de datos y configurar las variables necesarias.

```bash
cd backend
./mvnw spring-boot:run
```

### Aplicación

Consulta [mobile/README.md](mobile/README.md) para configurar la URL de la API.

```bash
cd mobile
npm ci
npm start
```

## Estructura

```text
gymflow/
├── mobile/       # Aplicación Expo / React Native
├── backend/      # API REST Spring Boot
├── docs/         # Arquitectura, API y decisiones técnicas
└── .github/      # Validación continua
```

## Próximos pasos

- Preparar datos de demostración reproducibles.
- Incorporar migraciones versionadas de base de datos.
- Sustituir el almacenamiento local de archivos por un servicio de objetos.
- Añadir observabilidad y límites de peticiones para un despliegue real.

## Autora

Desarrollado por **Julia Cuevas**.

El código se publica con fines de evaluación profesional. Consulta [LICENSE](LICENSE) antes de reutilizarlo.
