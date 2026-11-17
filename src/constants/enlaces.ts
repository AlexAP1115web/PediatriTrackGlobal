// Enlaces públicos de la app.
//
// URL_APK: página de Expo para instalar la última versión de Android. Cada
// vez que hago un build nuevo (eas build -p android --profile preview)
// pego aquí, o en EXPO_PUBLIC_APK_URL de .env.local, el link que imprime la
// terminal y vuelvo a publicar la web (npm run deploy:web). Así el botón
// "Descargar para Android" de la versión web siempre lleva al último APK.
export const URL_APK =
  process.env.EXPO_PUBLIC_APK_URL ||
  "https://expo.dev/accounts/pediatritrack/projects/PediatriTrackGlobal/builds/fa63aa47-4abd-4840-b5cd-eb3e607c795b";
