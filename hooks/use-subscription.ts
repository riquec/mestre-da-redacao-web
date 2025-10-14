import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Subscription } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { SUBSCRIPTION_CONFIG } from '@/lib/subscription-config'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      console.log('💳 [SUBSCRIPTION] Iniciando fetchSubscription...')
      console.log('💳 [SUBSCRIPTION] User:', user ? { uid: user.uid, email: user.email } : 'NÃO AUTENTICADO')
      
      if (!user) {
        console.log('💳 [SUBSCRIPTION] Usuário não autenticado, abortando')
        setLoading(false)
        return
      }

      try {
        console.log('💳 [SUBSCRIPTION] Buscando assinatura para userId:', user.uid)
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(subscriptionsRef, where('userId', '==', user.uid))
        const querySnapshot = await getDocs(q)
        
        console.log('💳 [SUBSCRIPTION] Query concluída. Documentos encontrados:', querySnapshot.size)
        console.log('💳 [SUBSCRIPTION] Query vazia?', querySnapshot.empty)

        if (!querySnapshot.empty) {
          const subscriptionDoc = querySnapshot.docs[0]
          let subscriptionData = { id: subscriptionDoc.id, ...subscriptionDoc.data() } as Subscription
          console.log('💳 [SUBSCRIPTION] Assinatura encontrada:', {
            id: subscriptionData.id,
            type: subscriptionData.type,
            status: subscriptionData.status,
            tokens: subscriptionData.tokens
          })
          
          // Verificar e fazer reset automático para plano Mestre
          if (subscriptionData.type === 'mestre') {
            const shouldReset = checkIfShouldResetTokens(subscriptionData)
            
            if (shouldReset) {
              // Fazer reset automático e transparente
              try {
                await updateDoc(doc(db, 'subscriptions', subscriptionData.id), {
                  'tokens.available': SUBSCRIPTION_CONFIG.MESTRE_MONTHLY_TOKENS,
                  lastTokenReset: serverTimestamp(),
                  updatedAt: serverTimestamp()
                })
                
                // Atualizar dados locais com os novos valores
                subscriptionData = {
                  ...subscriptionData,
                  tokens: {
                    ...subscriptionData.tokens,
                    available: SUBSCRIPTION_CONFIG.MESTRE_MONTHLY_TOKENS
                  }
                }
                
                console.log('Tokens resetados automaticamente para o plano Mestre')
              } catch (resetError) {
                console.error('Erro ao resetar tokens automaticamente:', resetError)
                // Não bloquear o fluxo se o reset falhar
              }
            }
          }
          
          // MIGRAÇÃO: Verificar se aluno private/partner precisa migrar de unlimited: true para 6 tokens
          if ((subscriptionData.type === 'private' || subscriptionData.type === 'partner') && 
              (subscriptionData.tokens as any)?.unlimited === true) {
            console.log('🔄 Detectada assinatura antiga com unlimited: true, iniciando migração...')
            
            try {
              await updateDoc(doc(db, 'subscriptions', subscriptionData.id), {
                'tokens.available': 6,
                'tokens.unlimited': false, // Remover o campo unlimited
                updatedAt: serverTimestamp()
              })
              
              // Atualizar dados locais com os novos valores
              subscriptionData = {
                ...subscriptionData,
                tokens: {
                  available: 6
                }
              }
              
              console.log('✅ Migração concluída: 6 tokens adicionados, unlimited removido')
            } catch (migrationError) {
              console.error('❌ Erro na migração automática:', migrationError)
              // Não bloquear o fluxo se a migração falhar
            }
          }
          
          setSubscription(subscriptionData)
          console.log('💳 [SUBSCRIPTION] Estado atualizado com assinatura')
        } else {
          console.warn('💳 [SUBSCRIPTION] Nenhuma assinatura encontrada para este usuário')
        }
      } catch (err: any) {
        console.error('❌ [SUBSCRIPTION] ERRO ao buscar assinatura:', err)
        console.error('❌ [SUBSCRIPTION] Erro code:', err?.code)
        console.error('❌ [SUBSCRIPTION] Erro message:', err?.message)
        setError(err as Error)
      } finally {
        setLoading(false)
        console.log('💳 [SUBSCRIPTION] fetchSubscription finalizado')
      }
    }

    fetchSubscription()
  }, [user])
  
  // Função auxiliar para verificar se deve resetar tokens
  function checkIfShouldResetTokens(subscription: Subscription): boolean {
    const now = new Date()
    const lastReset = subscription.lastTokenReset?.toDate?.() || null
    
    // Se nunca foi resetado, deve resetar
    if (!lastReset) return true
    
    // Verifica se mudou o mês
    const hasMonthChanged = now.getMonth() !== lastReset.getMonth() || 
                           now.getFullYear() !== lastReset.getFullYear()
    
    return hasMonthChanged
  }

  return { subscription, loading, error }
} 