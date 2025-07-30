const { Storage } = require('@google-cloud/storage');
const path = require('path');

console.log('🔧 Configurando CORS para Firebase Storage via Google Cloud Storage...\n');

// Configurar o Google Cloud Storage com as credenciais
const storage = new Storage({
  projectId: 'mestre-da-redacao',
  keyFilename: path.join(__dirname, '..', 'serviceAccountKey.json')
});

async function configureCors() {
  try {
    console.log('📋 Obtendo referência do bucket...');
    
    const bucketName = 'mestre-da-redacao.firebasestorage.app'; // Nome correto do bucket
    const bucket = storage.bucket(bucketName);
    
    // Verificar se o bucket existe
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error(`❌ Bucket ${bucketName} não existe!`);
      return;
    }
    
    console.log('✅ Bucket encontrado!');
    console.log('🔧 Configurando CORS...');
    
    // Configuração de CORS
    const corsConfiguration = [
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: [
          'Content-Type', 
          'Authorization', 
          'Content-Length', 
          'User-Agent', 
          'x-goog-resumable',
          'x-goog-content-length-range',
          'x-firebase-storage-version',
          'access-control-allow-origin',
          'access-control-allow-methods',
          'access-control-allow-headers'
        ]
      }
    ];
    
    // Aplicar configuração de CORS
    await bucket.setCorsConfiguration(corsConfiguration);
    
    console.log('✅ CORS configurado com sucesso!');
    console.log('📋 Configuração aplicada:');
    console.log('   - Origins: * (todos os domínios)');
    console.log('   - Methods: GET, POST, PUT, DELETE, HEAD, OPTIONS');
    console.log('   - Max Age: 3600 segundos');
    console.log('   - Headers: Content-Type, Authorization, etc.');
    
    // Verificar a configuração aplicada
    console.log('\n📊 Verificando configuração aplicada...');
    const [metadata] = await bucket.getMetadata();
    if (metadata.cors) {
      console.log('✅ CORS configurado:', JSON.stringify(metadata.cors, null, 2));
    } else {
      console.log('⚠️ CORS não encontrado nos metadados, mas pode ter sido aplicado');
    }
    
    console.log('\n🎉 Configuração de CORS concluída!');
    console.log('🔄 Pode levar alguns minutos para as mudanças se propagarem.');
    console.log('🧪 Teste o upload de anexos no chat para verificar se funcionou.');
    
  } catch (error) {
    console.error('\n❌ Erro ao configurar CORS:', error.message);
    
    if (error.code === 403) {
      console.log('\n🔐 Erro de permissão! Soluções:');
      console.log('1. Verificar se a service account tem permissão de Storage Admin');
      console.log('2. Ativar a API Google Cloud Storage no projeto');
      console.log('3. Configurar CORS manualmente no Console do Firebase');
    } else if (error.code === 404) {
      console.log('\n🔍 Bucket não encontrado! Verificar:');
      console.log('1. Nome do bucket está correto');
      console.log('2. Projeto está configurado corretamente');
    } else {
      console.log('\n🔧 Erro desconhecido:', error);
    }
  }
}

configureCors().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 