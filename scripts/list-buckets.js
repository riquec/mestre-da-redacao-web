const { Storage } = require('@google-cloud/storage');
const path = require('path');

console.log('🔍 Listando buckets do projeto Firebase...\n');

// Configurar o Google Cloud Storage com as credenciais
const storage = new Storage({
  projectId: 'mestre-da-redacao',
  keyFilename: path.join(__dirname, '..', 'serviceAccountKey.json')
});

async function listBuckets() {
  try {
    console.log('📋 Obtendo lista de buckets...');
    
    const [buckets] = await storage.getBuckets();
    
    if (buckets.length === 0) {
      console.log('❌ Nenhum bucket encontrado no projeto!');
      return;
    }
    
    console.log(`✅ Encontrados ${buckets.length} bucket(s):`);
    console.log('');
    
    for (const bucket of buckets) {
      console.log(`📦 Bucket: ${bucket.name}`);
      
      try {
        const [metadata] = await bucket.getMetadata();
        console.log(`   📍 Localização: ${metadata.location}`);
        console.log(`   🏷️  Storage Class: ${metadata.storageClass}`);
        console.log(`   📅 Criado em: ${metadata.timeCreated}`);
        
        if (metadata.cors) {
          console.log(`   🔧 CORS: Configurado`);
        } else {
          console.log(`   ⚠️  CORS: Não configurado`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao obter metadados: ${error.message}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao listar buckets:', error.message);
    
    if (error.code === 403) {
      console.log('\n🔐 Erro de permissão! Verifique se a service account tem as permissões necessárias.');
    }
  }
}

listBuckets().then(() => {
  console.log('🏁 Listagem finalizada.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 