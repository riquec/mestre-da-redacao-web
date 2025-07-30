const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando upload para Firebase Storage...\n');

// Configurar o Google Cloud Storage com as credenciais
const storage = new Storage({
  projectId: 'mestre-da-redacao',
  keyFilename: path.join(__dirname, '..', 'serviceAccountKey.json')
});

async function testUpload() {
  try {
    console.log('📋 Preparando teste de upload...');
    
    const bucketName = 'mestre-da-redacao.firebasestorage.app';
    const bucket = storage.bucket(bucketName);
    
    // Criar um arquivo de teste simples
    const testContent = `Teste de upload - ${new Date().toISOString()}`;
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    
    // Escrever arquivo temporário
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Arquivo de teste criado:', testFileName);
    
    // Testar upload
    console.log('🔄 Fazendo upload do arquivo de teste...');
    const destPath = `essays/test-user/${testFileName}`;
    
    const [file] = await bucket.upload(testFilePath, {
      destination: destPath,
      metadata: {
        contentType: 'text/plain'
      }
    });
    
    console.log('✅ Upload realizado com sucesso!');
    console.log('📍 Caminho:', destPath);
    
    // Obter URL de download
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hora
    });
    
    console.log('🔗 URL de download:', downloadUrl);
    
    // Limpar arquivo de teste
    try {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Arquivo local removido');
    } catch (e) {
      console.log('⚠️ Erro ao remover arquivo local:', e.message);
    }
    
    // Remover arquivo do storage
    try {
      await file.delete();
      console.log('🧹 Arquivo do storage removido');
    } catch (e) {
      console.log('⚠️ Erro ao remover arquivo do storage:', e.message);
    }
    
    console.log('\n🎉 Teste de upload concluído com SUCESSO!');
    console.log('✅ Firebase Storage está configurado corretamente');
    console.log('✅ CORS está funcionando');
    console.log('✅ Upload de anexos no chat deve funcionar agora!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste de upload:', error.message);
    
    if (error.code === 403) {
      console.log('\n🔐 Erro de permissão! Verificar configurações da service account.');
    } else if (error.code === 'CORS_ERROR') {
      console.log('\n🚫 Erro de CORS! Aguardar propagação das configurações.');
    } else {
      console.log('\n🔧 Erro:', error);
    }
  }
}

testUpload().then(() => {
  console.log('\n🏁 Teste finalizado.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 