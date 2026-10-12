import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// los datos de Firebase ahora salen del .env.local (igual que en MediCore)
// en vez de estar escritos aquí directo. Si alguien del equipo clona el
// repo, copia .env.example como .env.local y pone los valores del proyecto
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// aviso claro en la consola si falta el .env.local, para no andar
// adivinando por qué no funciona el login
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "Faltan las variables de Firebase. Copia .env.example como .env.local, " +
      "llena los datos y reinicia con: npx expo start -c"
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// esto lo puse para que los correos automáticos de Firebase (recuperar
// contraseña, verificar correo) me lleguen en español y no en inglés
auth.languageCode = "es";

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
