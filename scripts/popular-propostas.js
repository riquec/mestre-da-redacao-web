const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Troque pelo nome do seu bucket!
const BUCKET_NAME = 'mestre-da-redacao.firebasestorage.app';

// Inicialização do Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET_NAME
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const pastaPropostas = path.join(__dirname, '../arquivos-de-propostas');

async function processarArquivos() {
  const arquivos = fs.readdirSync(pastaPropostas).filter(f => f.endsWith('.pdf'));
  for (const arquivo of arquivos) {
    const filePath = path.join(pastaPropostas, arquivo);

    // Extrair título e código do ano
    const nomeSemExt = path.basename(arquivo, '.pdf');
    // Regex: remove número e hífen do início, e código do ano do final
    const titulo = nomeSemExt.replace(/^\d+\s*-\s*/, '').replace(/\s*-\s*\d{4}-\d$/, '');
    const yearCodeMatch = nomeSemExt.match(/(\d{4}-\d)$/);
    const yearCode = yearCodeMatch ? yearCodeMatch[1] : '';

    // Upload para o Storage
    const storagePath = `proposals/materials/${arquivo}`;
    await bucket.upload(filePath, { destination: storagePath });
    const file = bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491'
    });

    // Criar documento no Firestore
    await db.collection('essayThemes').add({
      title: titulo,
      category: 'ENEM_PASSADO',
      tags: [],
      file: {
        name: arquivo,
        url: url
      },
      yearCode: yearCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    });

    console.log(`Proposta cadastrada: ${titulo}`);
  }
}

processarArquivos().then(() => {
  console.log('Todas as propostas foram cadastradas!');
  process.exit(0);
}).catch(err => {
  console.error('Erro:', err);
  process.exit(1);
}); 