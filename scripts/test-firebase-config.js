#!/usr/bin/env node

/**
 * Script para testar configuração do Firebase
 * Uso: node scripts/test-firebase-config.js
 */

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

console.log('🧪 Testando configuração do Firebase...\n');

// Verificar variáveis de ambiente
console.log('1. Verificando variáveis de ambiente:');
let allVarsPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allVarsPresent = false;
  }
});

console.log('\n2. Verificando variáveis opcionais:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚠️ ${varName}: MISSING (opcional - Analytics não funcionará)`);
  }
});

if (!allVarsPresent) {
  console.log('\n❌ Algumas variáveis de ambiente estão faltando!');
  console.log('Verifique o arquivo .env.local e adicione as variáveis necessárias.');
  process.exit(1);
}

// Testar conexão com Firebase
console.log('\n3. Testando conexão com Firebase:');

try {
  const { initializeApp } = require('firebase/app');
  const { getAuth, connectAuthEmulator } = require('firebase/auth');
  const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
  const { getStorage, connectStorageEmulator } = require('firebase/storage');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App inicializado');

  const auth = getAuth(app);
  console.log('✅ Firebase Auth inicializado');

  const db = getFirestore(app);
  console.log('✅ Firebase Firestore inicializado');

  const storage = getStorage(app);
  console.log('✅ Firebase Storage inicializado');

  // Testar Analytics se measurementId estiver presente
  if (firebaseConfig.measurementId) {
    const { getAnalytics, isSupported } = require('firebase/analytics');
    isSupported().then(isAnalyticsSupported => {
      if (isAnalyticsSupported) {
        const analytics = getAnalytics(app);
        console.log('✅ Firebase Analytics inicializado');
      } else {
        console.log('⚠️ Firebase Analytics não suportado neste ambiente');
      }
    }).catch(error => {
      console.log('⚠️ Erro ao testar Analytics:', error.message);
    });
  } else {
    console.log('⚠️ Firebase Analytics não inicializado: measurementId não configurado');
  }

  console.log('\n🎉 Todas as configurações estão corretas!');
  console.log('Se você ainda está vendo erros, pode ser um problema temporário ou de rede.');
  
} catch (error) {
  console.log('\n❌ Erro ao conectar com Firebase:');
  console.log(error.message);
  
  if (error.code === 'auth/invalid-api-key') {
    console.log('\n🔑 Solução: Verifique a API Key no console do Firebase:');
    console.log('1. Acesse https://console.firebase.google.com/');
    console.log('2. Selecione seu projeto "mestre-da-redacao"');
    console.log('3. Vá em Project Settings > General > Your apps');
    console.log('4. Copie a nova API Key e atualize o .env.local');
  }
  
  process.exit(1);
}

console.log('\n📋 Próximos passos:');
console.log('1. Se tudo estiver funcionando, você pode remover os logs de debug do firebase.ts');
console.log('2. Para problemas de Analytics, verifique se está habilitado no console do Firebase');
console.log('3. Execute: npm run build && npm start para testar em produção'); 