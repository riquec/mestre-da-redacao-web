import { 
  collection, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore'
import { deleteUser as deleteAuthUser, getAuth } from 'firebase/auth'
import { db } from './firebase'
import { User } from './types'

export interface StudentData extends User {
  subscription?: {
    type: string
    tokens?: {
      available: number
      // unlimited removido - todos os planos limitados a 6 correções
    }
  }
  essaysCount?: number
  lastActivity?: Date
}

/**
 * Busca todos os alunos do sistema
 */
export async function getAllStudents(): Promise<StudentData[]> {
  try {
    const usersRef = collection(db, 'users')
    const q = query(
      usersRef, 
      where('role', '==', 'student'),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    
    const snapshot = await getDocs(q)
    const students: StudentData[] = []
    
    for (const doc of snapshot.docs) {
      const userData = { id: doc.id, ...doc.data() } as User
      
      // Buscar dados da assinatura
      const subQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', doc.id)
      )
      const subSnapshot = await getDocs(subQuery)
      
      let subscriptionData = null
      if (!subSnapshot.empty) {
        subscriptionData = subSnapshot.docs[0].data()
      }
      
      // Contar redações enviadas
      const essaysQuery = query(
        collection(db, 'essays'),
        where('userId', '==', doc.id)
      )
      const essaysSnapshot = await getDocs(essaysQuery)
      
      students.push({
        ...userData,
        subscription: subscriptionData as any,
        essaysCount: essaysSnapshot.size,
        lastActivity: userData.lastLogin?.toDate() || userData.createdAt?.toDate()
      })
    }
    
    return students
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    throw error
  }
}

/**
 * Deleta completamente um usuário e todos os seus dados relacionados
 */
export async function deleteUserCompletely(userId: string): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    // 1. Deletar documento do usuário
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado')
    }
    
    batch.delete(userRef)
    
    // 2. Deletar assinatura
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId)
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    subscriptionsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 3. Deletar redações
    const essaysQuery = query(
      collection(db, 'essays'),
      where('userId', '==', userId)
    )
    const essaysSnapshot = await getDocs(essaysQuery)
    essaysSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 4. Deletar correções
    const correctionsQuery = query(
      collection(db, 'corrections'),
      where('userId', '==', userId)
    )
    const correctionsSnapshot = await getDocs(correctionsQuery)
    correctionsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 5. Deletar chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('studentId', '==', userId)
    )
    const chatsSnapshot = await getDocs(chatsQuery)
    chatsSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 6. Deletar mensagens dos chats
    for (const chatDoc of chatsSnapshot.docs) {
      const messagesQuery = query(
        collection(db, 'chats', chatDoc.id, 'messages')
      )
      const messagesSnapshot = await getDocs(messagesQuery)
      messagesSnapshot.forEach(msgDoc => {
        batch.delete(msgDoc.ref)
      })
    }
    
    // Executar todas as deleções em batch
    await batch.commit()
    
    // 7. Tentar deletar do Firebase Auth (pode falhar se o usuário não existir mais)
    try {
      const auth = getAuth()
      // Nota: Isso só funciona se o usuário estiver autenticado ou se tivermos privilégios admin
      // Em produção, isso geralmente é feito via Cloud Functions com Admin SDK
      console.log('Usuário deletado do Firestore. Deleção do Auth requer Admin SDK.')
    } catch (authError) {
      console.warn('Não foi possível deletar do Auth (requer Admin SDK):', authError)
    }
    
    console.log(`Usuário ${userId} e todos os dados relacionados foram deletados com sucesso`)
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    throw error
  }
}

/**
 * Busca dados detalhados de um aluno específico
 */
export async function getStudentDetails(userId: string): Promise<StudentData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return null
    }
    
    const userData = { id: userDoc.id, ...userDoc.data() } as User
    
    // Buscar assinatura
    const subQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId)
    )
    const subSnapshot = await getDocs(subQuery)
    
    let subscriptionData = null
    if (!subSnapshot.empty) {
      subscriptionData = subSnapshot.docs[0].data()
    }
    
    // Contar redações
    const essaysQuery = query(
      collection(db, 'essays'),
      where('userId', '==', userId)
    )
    const essaysSnapshot = await getDocs(essaysQuery)
    
    return {
      ...userData,
      subscription: subscriptionData as any,
      essaysCount: essaysSnapshot.size,
      lastActivity: userData.lastLogin?.toDate() || userData.createdAt?.toDate()
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes do aluno:', error)
    throw error
  }
}