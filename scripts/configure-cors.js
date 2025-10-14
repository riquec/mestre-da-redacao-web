const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando CORS para Firebase Storage...\n');

// Verificar se o arquivo cors.json existe
const corsFile = path.join(__dirname, '..', 'cors.json');
if (!fs.existsSync(corsFile)) {
  console.error('❌ Arquivo cors.json não encontrado!');
  process.exit(1);
}

try {
  // Comando para configurar CORS no Firebase Storage
  const bucketName = 'mestre-da-redacao.firebasestorage.app';
  const command = `gsutil cors set cors.json gs://${bucketName}`;
  
  console.log('📋 Executando comando:', command);
  console.log('⏳ Aguarde...\n');
  
  const result = execSync(command, { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ CORS configurado com sucesso!');
  console.log('📋 Configuração aplicada:');
  console.log('   - Origins: * (todos os domínios)');
  console.log('   - Methods: GET, POST, PUT, DELETE, HEAD, OPTIONS');
  console.log('   - Max Age: 3600 segundos');
  console.log('   - Headers: Content-Type, Authorization, etc.');
  
  console.log('\n🎉 Agora o upload de anexos do chat deve funcionar!');
  
} catch (error) {
  console.error('\n❌ Erro ao configurar CORS:', error.message);
  console.log('\n🔧 Solução manual:');
  console.log('1. Instale o Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
  console.log('2. Faça login: gcloud auth login');
  console.log('3. Configure o projeto: gcloud config set project mestre-da-redacao');
  console.log('4. Execute: gsutil cors set cors.json gs://mestre-da-redacao.firebasestorage.app');
} 