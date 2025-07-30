// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase Configuration with fallback
const getFirebaseConfig = () => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyABZJxTb4i_SDIBE-j530FN1cGBwmkB054",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mestre-da-redacao.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mestre-da-redacao",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mestre-da-redacao.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "246149396088",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:246149396088:web:7c7b1d3a8e9f5a6b2c3d4e",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined
  };
};

// Lazy initialization variables
let _app: FirebaseApp | null = null;
let _analytics: Analytics | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

// Initialize Firebase (lazy loading)
const initializeFirebase = () => {
  if (_app) return; // Already initialized

  try {
    const firebaseConfig = getFirebaseConfig();
    
    // Validate required fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Algumas configurações do Firebase estão ausentes:', missingFields);
      console.warn('🔧 Usando configurações padrão como fallback');
    }

    // Initialize Firebase App
    _app = initializeApp(firebaseConfig);
    
    // Initialize services
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _storage = getStorage(_app);

    // Initialize Analytics only in browser (completely optional)
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      // Wrap in setTimeout to avoid blocking main initialization
      setTimeout(() => {
        isSupported().then((supported) => {
          if (supported) {
            try {
              _analytics = getAnalytics(_app!);
              console.log('✅ Firebase Analytics inicializado');
            } catch (error) {
              console.log('⚠️ Firebase Analytics não disponível (permissões)');
              _analytics = null;
            }
          }
        }).catch(() => {
          // Silent fail for analytics
          _analytics = null;
        });
      }, 100);
    }

    console.log('✅ Firebase inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    // Don't throw error, just log it
  }
};

// Getter functions with lazy initialization
export const getFirebaseApp = (): FirebaseApp => {
  if (!_app) {
    initializeFirebase();
  }
  if (!_app) {
    throw new Error('Firebase App não pôde ser inicializado');
  }
  return _app;
};

export const getFirebaseAuth = (): Auth => {
  if (!_auth) {
    initializeFirebase();
  }
  if (!_auth) {
    throw new Error('Firebase Auth não pôde ser inicializado');
  }
  return _auth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!_db) {
    initializeFirebase();
  }
  if (!_db) {
    throw new Error('Firebase Firestore não pôde ser inicializado');
  }
  return _db;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!_storage) {
    initializeFirebase();
  }
  if (!_storage) {
    throw new Error('Firebase Storage não pôde ser inicializado');
  }
  return _storage;
};

export const getFirebaseAnalytics = (): Analytics | null => {
  if (!_app) {
    initializeFirebase();
  }
  return _analytics;
};

// Simple lazy exports for backward compatibility
export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const storage = getFirebaseStorage();
export const analytics = getFirebaseAnalytics();

// Initialize immediately if we're in the browser
if (typeof window !== 'undefined') {
  initializeFirebase();
} 