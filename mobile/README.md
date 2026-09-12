# GymFlow Mobile

Aplicación para Android, iOS y web construida con Expo, React Native y TypeScript.

## Configuración

1. Copia `.env.example` como `.env`.
2. Define `EXPO_PUBLIC_API_URL` con la URL completa de la API, incluyendo `/api`.
3. Instala las dependencias y arranca Expo.

```bash
npm ci
npm start
```

Para Expo Go en un dispositivo físico, utiliza la IP local del equipo que ejecuta el backend:

```dotenv
EXPO_PUBLIC_API_URL=http://<IP_LOCAL>:8080/api
```

La dirección anterior es solo un ejemplo; debe sustituirse por la correspondiente a cada red.

## Validación

```bash
npm run check
npx expo export --platform all
```

`npm run check` ejecuta las pruebas unitarias, TypeScript y ESLint.
