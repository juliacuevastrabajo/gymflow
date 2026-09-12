# GymFlow Backend

API REST construida con Java 17, Spring Boot, Spring Data JPA y MySQL.

## Configuración

1. Crea una base de datos MySQL llamada `gymflow_db`.
2. Copia `src/main/resources/application-example.properties` como `application.properties`.
3. Configura las variables de entorno:

```dotenv
DB_PASSWORD=change-me
GYMFLOW_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
GYMFLOW_INVITATION_SECRET=use-a-different-random-secret-of-at-least-32-characters
GYMFLOW_CORS_ALLOWED_ORIGINS=http://localhost:8081
```

También pueden personalizarse `DB_URL`, `DB_USERNAME`, `GYMFLOW_UPLOAD_DIR`, `JPA_DDL_AUTO` y `JPA_SHOW_SQL`.

`JPA_DDL_AUTO=update` facilita el desarrollo local. Para un despliegue real se recomienda utilizar migraciones versionadas y un valor como `validate`.

## Ejecución

```bash
./mvnw spring-boot:run
```

En Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## Pruebas

```bash
./mvnw test
```

Las pruebas usan H2 en memoria y no escriben en la base de datos MySQL local.
