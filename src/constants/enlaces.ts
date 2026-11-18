// Enlaces públicos de la app.
//
// URL_APK: descarga directa del APK más reciente de Android. OJO: tiene que
// ser el link "Download build" (expo.dev/artifacts/eas/....apk) que sale en
// el menú ⋮ del build en expo.dev, o el "Application Archive URL" de
// `eas build:view <id>`. El link de la página del build pide iniciar sesión
// en Expo y a los demás les sale "Account not found".
// Cada build nuevo: pego aquí (o en EXPO_PUBLIC_APK_URL de .env.local) el
// link nuevo y vuelvo a publicar la web con npm run deploy:web.
export const URL_APK =
  process.env.EXPO_PUBLIC_APK_URL ||
  "https://expo.dev/artifacts/eas/wEINkuK8Y9X_WCyHYbaIaM-tz_-kmYck2nbtc4CMRZc.apk";
