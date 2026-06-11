import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

// Configuración del proyecto Firebase. Es pública por diseño (el navegador
// la recibe siempre); la seguridad la dan las reglas de Firestore. Las
// variables de entorno permiten apuntar a otro proyecto sin tocar código.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyD55eR8OSfGacyt1RgtjOuTUkHsiiDS_n0",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "mundialfantasy-b742e.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mundialfantasy-b742e",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "mundialfantasy-b742e.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "671630493709",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:671630493709:web:654e90417e6febd494ad44",
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey);

// Sin credenciales (p. ej. durante el prerender de `next build`) no se
// inicializa nada; los hooks comprueban `firebaseConfigured` antes de usarlo.
const app = firebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : undefined;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const db = (app ? getFirestore(app) : undefined) as Firestore;
