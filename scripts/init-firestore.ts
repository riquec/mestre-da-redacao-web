const { initializeApp, cert } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")
const { config } = require("dotenv")
const { join } = require("path")
const { readFileSync } = require("fs")

// Carregar variáveis de ambiente
const currentDir = __dirname
console.log('Diretório atual:', currentDir)
config({ path: join(currentDir, "..", ".env") })

// Inicializar o Firebase Admin
console.log('Lendo serviceAccountKey.json...')
const serviceAccount = JSON.parse(readFileSync(join(currentDir, "serviceAccountKey.json"), "utf8"))
console.log('Service Account carregado com sucesso')

console.log('Inicializando Firebase Admin...')
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
})
console.log('Firebase Admin inicializado com sucesso')

const db = getFirestore(app)
console.log('Firestore inicializado com sucesso')

// IDs dos usuários - Substitua pelos IDs reais do Firebase
const PROFESSOR_ID = "SEU_ID_DO_PROFESSOR" // Substitua pelo UID do professor
const STUDENT_ID = "SEU_ID_DO_ALUNO" // Substitua pelo UID do aluno

async function initFirestore() {
  try {
    console.log("Verificando coleções...")

    // Lista de coleções necessárias
    const collections = [
      "users",
      "subscriptions",
      "essays",
      "lessons",
      "lessonProgress",
      "chats"
    ]

    // Verificar se cada coleção existe
    for (const collectionName of collections) {
      console.log(`Verificando coleção ${collectionName}...`)
      const collectionRef = db.collection(collectionName)
      const snapshot = await collectionRef.limit(1).get()
      
      if (!snapshot.empty) {
        console.log(`Coleção ${collectionName} já existe`)
      } else {
        console.log(`Criando coleção ${collectionName}...`)
        // Criar um documento vazio para inicializar a coleção
        await collectionRef.add({})
        console.log(`Coleção ${collectionName} criada com sucesso`)
      }
    }

    console.log("Estrutura do banco de dados verificada com sucesso!")
  } catch (error) {
    console.error("Erro ao verificar estrutura do banco de dados:", error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  }
}

initFirestore() 