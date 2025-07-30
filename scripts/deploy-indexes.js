const { execSync } = require('child_process');

console.log('🚀 Deployando índices do Firestore...');

try {
  // Deploy dos índices
  execSync('firebase deploy --only firestore:indexes', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Índices deployados com sucesso!');
  console.log('📝 Os índices podem levar alguns minutos para ficarem ativos.');
  
} catch (error) {
  console.error('❌ Erro ao deployar índices:', error.message);
  console.log('💡 Certifique-se de que você está logado no Firebase: firebase login');
  process.exit(1);
} 