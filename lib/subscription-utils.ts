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
      available: 0,
      unlimited: true
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
      available: 0,
      unlimited: true
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
  
  // Só adiciona tokens se não for unlimited
  if (!subscription.tokens.unlimited) {
    await updateDoc(subscriptionRef, {
      "tokens.available": (subscription.tokens.available || 0) + amount,
      updatedAt: serverTimestamp()
    })
  }
}

export async function canSubmitEssay(userId: string): Promise<boolean> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    return false
  }
  
  const subscription = subscriptionDoc.data()
  
  // Se for unlimited, sempre pode enviar
  if (subscription.tokens.unlimited) {
    return true
  }
  
  // Se tiver tokens disponíveis, pode enviar
  return (subscription.tokens.available || 0) > 0
}

export async function useTokenForEssay(userId: string): Promise<void> {
  const subscriptionRef = doc(db, "subscriptions", userId)
  const subscriptionDoc = await getDoc(subscriptionRef)
  
  if (!subscriptionDoc.exists()) {
    throw new Error("Assinatura não encontrada")
  }
  
  const subscription = subscriptionDoc.data()
  
  // Se for unlimited, não precisa decrementar
  if (subscription.tokens.unlimited) {
    return
  }
  
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