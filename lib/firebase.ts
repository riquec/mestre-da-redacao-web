// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Configuração do Firebase:', {
  ...firebaseConfig,
  apiKey: '***' // Não logamos a chave da API por segurança
})

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
let analytics: Analytics | null = null;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  console.log('App Firebase inicializado:', app.name)

  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('Serviços Firebase inicializados:', {
    auth: !!auth,
    db: !!db,
    analytics: !!analytics,
    storage: !!storage
  })
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error)
  throw error
}

export { app, analytics, auth, db, storage }; 