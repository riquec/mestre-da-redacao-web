const fs = require('fs');
const path = require('path');

/**
 * Script para ADICIONAR novos índices ao Firestore
 * Este script NÃO remove índices existentes, apenas adiciona os novos necessários
 */

const INDEXES_FILE = path.join(__dirname, '..', 'firestore.indexes.json');

// Novos índices que precisam ser adicionados
const NEW_INDEXES = [
  {
    collectionGroup: "users",
    queryScope: "COLLECTION",
    fields: [
      {
        fieldPath: "role",
        order: "ASCENDING"
      },
      {
        fieldPath: "createdAt",
        order: "DESCENDING"
      }
    ],
    reason: "Query: where('role', '==', 'student') + orderBy('createdAt', 'desc')",
    usedIn: ["hooks/use-professor-students.ts"]
  },
  {
    collectionGroup: "lessons",
    queryScope: "COLLECTION",
    fields: [
      {
        fieldPath: "active",
        order: "ASCENDING"
      },
      {
        fieldPath: "createdAt",
        order: "DESCENDING"
      }
    ],
    reason: "Query: where('active', '==', true) + orderBy('createdAt', 'desc')",
    usedIn: [
      "app/dashboard/aulas/page.tsx",
      "app/professor/dashboard/aulas/page.tsx"
    ]
  },
  {
    collectionGroup: "essays",
    queryScope: "COLLECTION",
    fields: [
      {
        fieldPath: "userId",
        order: "ASCENDING"
      },
      {
        fieldPath: "submittedAt",
        order: "DESCENDING"
      }
    ],
    reason: "Query: where('userId', '==', user.uid) + orderBy('submittedAt', 'desc')",
    usedIn: ["hooks/use-essays.ts", "app/dashboard/page.tsx"]
  },
  {
    collectionGroup: "chats",
    queryScope: "COLLECTION",
    fields: [
      {
        fieldPath: "userId",
        order: "ASCENDING"
      },
      {
        fieldPath: "lastMessage",
        order: "DESCENDING"
      }
    ],
    reason: "Query: where('userId', '==', user.uid) + orderBy('lastMessage', 'desc')",
    usedIn: ["hooks/use-chats.ts", "app/dashboard/page.tsx"]
  }
];

function readIndexesFile() {
  try {
    const content = fs.readFileSync(INDEXES_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de índices:', error.message);
    process.exit(1);
  }
}

function writeIndexesFile(data) {
  try {
    fs.writeFileSync(INDEXES_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('✅ Arquivo firestore.indexes.json atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao escrever arquivo de índices:', error.message);
    process.exit(1);
  }
}

function indexExists(existingIndexes, newIndex) {
  return existingIndexes.some(existing => {
    if (existing.collectionGroup !== newIndex.collectionGroup) return false;
    if (existing.queryScope !== newIndex.queryScope) return false;
    
    if (existing.fields.length !== newIndex.fields.length) return false;
    
    return existing.fields.every((field, idx) => {
      const newField = newIndex.fields[idx];
      return field.fieldPath === newField.fieldPath && 
             field.order === newField.order;
    });
  });
}

function addIndexes() {
  console.log('📋 Script para adicionar índices do Firestore\n');
  
  // Ler arquivo atual
  const indexesData = readIndexesFile();
  const existingIndexes = indexesData.indexes || [];
  
  console.log(`📊 Índices existentes: ${existingIndexes.length}`);
  console.log(`📊 Novos índices a verificar: ${NEW_INDEXES.length}\n`);
  
  let addedCount = 0;
  let skippedCount = 0;
  
  // Adicionar novos índices (se não existirem)
  NEW_INDEXES.forEach((newIndex, idx) => {
    const { reason, usedIn, ...indexData } = newIndex;
    
    if (indexExists(existingIndexes, indexData)) {
      console.log(`⏭️  Índice ${idx + 1}/${NEW_INDEXES.length}: JÁ EXISTE`);
      console.log(`   Collection: ${indexData.collectionGroup}`);
      console.log(`   Fields: ${indexData.fields.map(f => f.fieldPath).join(', ')}`);
      console.log('');
      skippedCount++;
    } else {
      existingIndexes.push(indexData);
      console.log(`✅ Índice ${idx + 1}/${NEW_INDEXES.length}: ADICIONADO`);
      console.log(`   Collection: ${indexData.collectionGroup}`);
      console.log(`   Fields: ${indexData.fields.map(f => `${f.fieldPath} (${f.order})`).join(', ')}`);
      console.log(`   Motivo: ${reason}`);
      console.log(`   Usado em: ${usedIn.join(', ')}`);
      console.log('');
      addedCount++;
    }
  });
  
  // Atualizar arquivo se houver novos índices
  if (addedCount > 0) {
    indexesData.indexes = existingIndexes;
    writeIndexesFile(indexesData);
    
    console.log('\n📈 RESUMO:');
    console.log(`   ✅ Índices adicionados: ${addedCount}`);
    console.log(`   ⏭️  Índices já existentes: ${skippedCount}`);
    console.log(`   📊 Total de índices agora: ${existingIndexes.length}`);
    console.log('\n🚀 Próximo passo: Execute "firebase deploy --only firestore:indexes"');
  } else {
    console.log('\n✨ Todos os índices necessários já existem!');
    console.log('   Nenhuma alteração foi feita.');
  }
}

// Executar script
addIndexes();

