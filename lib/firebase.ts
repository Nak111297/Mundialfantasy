import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey);

// Sin credenciales (p. ej. durante el prerender de `next build`) no se
// inicializa nada; los hooks comprueban `firebaseConfigured` antes de usarlo.
const app = firebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : undefined;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const db = (app ? getFirestore(app) : undefined) as Firestore;
