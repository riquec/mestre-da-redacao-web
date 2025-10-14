import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { SubscriptionType } from './types'

export async function updateSubscriptionToPrivate(
  userId: string,
  teacherId: string,
  teacherName: string
) {
  const subscriptionRef = doc(db, "subscriptions", userId)
  await updateDoc(subscriptionRef, {
    type: "private" as SubscriptionType,
    updatedAt: serverTimestamp(),
    tokens: {
      available: 6
    },
    privateInfo: {
      teacherId,
      teacherName
    }
  })
}

export async function updateSubscriptionToPartner(
  userId: string,
  institutionId: string,
  institutionName: string,
  contractEndDate: Date
) {
  const subscriptionRef = doc(db, "subscriptions", userId)
  await updateDoc(subscriptionRef, {
    type: "partner" as SubscriptionType,
    updatedAt: serverTimestamp(),
    tokens: {
      available: 6
    },
    partnerInfo: {
      institutionId,
      institutionName,
      contractEndDate
    }
  })
}

export async function addTokensToSubscription(
  userId: string,
  amount: number
) {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    throw new Error("Assinatura não encontrada")
  }
  
  const subscription = subscriptionDoc.data()
  
  // Adicionar tokens
  await updateDoc(subscriptionRef, {
    "tokens.available": (subscription.tokens.available || 0) + amount,
    updatedAt: serverTimestamp()
  })
}

// Função para verificar se o usuário tem acesso a videoaulas
export async function canAccessLessons(userId: string): Promise<boolean> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    return false
  }
  
  const subscription = subscriptionDoc.data()
  const type = subscription.type as SubscriptionType
  
  // Planos mestre, private e partner sempre têm acesso
  if (type === 'mestre' || type === 'private' || type === 'partner') {
    return true
  }
  
  // Avulsa tem acesso se tiver token ativo
  if (type === 'avulsa' && subscription.tokens && subscription.tokens.available > 0) {
    return true
  }
  
  return false
}

// Função para verificar se o usuário tem acesso a materiais didáticos
export async function canAccessMaterials(userId: string): Promise<boolean> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    return false
  }
  
  const subscription = subscriptionDoc.data()
  const type = subscription.type as SubscriptionType
  
  // Planos mestre, private e partner sempre têm acesso
  if (type === 'mestre' || type === 'private' || type === 'partner') {
    return true
  }
  
  // Avulsa tem acesso se tiver token ativo
  if (type === 'avulsa' && subscription.tokens && subscription.tokens.available > 0) {
    return true
  }
  
  return false
}

// Função para verificar se o usuário pode enviar redações
export async function canSubmitEssay(userId: string): Promise<boolean> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    return false
  }
  
  const subscription = subscriptionDoc.data()
  const type = subscription.type as SubscriptionType
  
  // Planos free não podem enviar redações
  if (type === 'free') {
    return false
  }
  
  // Se tiver tokens disponíveis, pode enviar
  return (subscription.tokens.available || 0) > 0
}

// Função para verificar se o usuário tem acesso ao chat
export async function canAccessChat(userId: string): Promise<boolean> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    return false
  }
  
  const subscription = subscriptionDoc.data()
  const type = subscription.type as SubscriptionType
  
  // Planos mestre, private e partner sempre têm acesso
  if (type === 'mestre' || type === 'private' || type === 'partner') {
    return true
  }
  
  // Avulsa tem acesso se tiver token ativo
  if (type === 'avulsa' && subscription.tokens && subscription.tokens.available > 0) {
    return true
  }
  
  return false
}

export async function useTokenForEssay(userId: string): Promise<void> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    throw new Error("Assinatura não encontrada")
  }
  
  const subscription = subscriptionDoc.data()
  
  // Se não tiver tokens disponíveis, não pode enviar
  if ((subscription.tokens.available || 0) <= 0) {
    throw new Error("Sem tokens disponíveis")
  }
  
  // Decrementa um token
  await updateDoc(subscriptionRef, {
    "tokens.available": subscription.tokens.available - 1,
    updatedAt: serverTimestamp()
  })
} 