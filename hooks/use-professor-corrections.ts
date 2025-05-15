import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { Essay } from '@/lib/types'

export function useProfessorCorrections() {
  const { user } = useAuth()
  const [pendingCorrections, setPendingCorrections] = useState<Essay[]>([])
  const [recentCorrections, setRecentCorrections] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCorrections() {
      if (!user) {
        console.log('[useProfessorCorrections] Usuário não autenticado')
        return
      }

      try {
        console.log('[useProfessorCorrections] Iniciando busca de correções')
        const essaysRef = collection(db, 'essays')
        
        // Buscar correções pendentes
        console.log('[useProfessorCorrections] Buscando correções pendentes')
        const pendingQuery = query(
          essaysRef,
          where('correction.status', '==', 'pending')
        )
        const pendingSnapshot = await getDocs(pendingQuery)
        const pending = pendingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Essay[]
        // Ordenar localmente por submittedAt
        pending.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis())
        console.log(`[useProfessorCorrections] Encontradas ${pending.length} correções pendentes`)
        setPendingCorrections(pending)

        // Buscar últimas 3 correções realizadas
        console.log('[useProfessorCorrections] Buscando correções recentes')
        const recentQuery = query(
          essaysRef,
          where('correction.status', '==', 'done')
        )
        const recentSnapshot = await getDocs(recentQuery)
        const recent = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Essay[]
        // Ordenar localmente por completedAt e pegar as 3 mais recentes
        recent.sort((a, b) => {
          const getMillis = (correction: any) => {
            if (correction && correction.completedAt && typeof correction.completedAt.toMillis === 'function') {
              return correction.completedAt.toMillis()
            }
            return 0
          }
          const aTime = getMillis(a.correction)
          const bTime = getMillis(b.correction)
          return bTime - aTime
        })
        console.log(`[useProfessorCorrections] Encontradas ${recent.length} correções recentes`)
        setRecentCorrections(recent.slice(0, 3))
      } catch (err) {
        console.error('[useProfessorCorrections] Erro ao buscar correções:', err)
        setError('Não foi possível carregar as correções. Por favor, tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchCorrections()
  }, [user])

  return {
    pendingCorrections,
    recentCorrections,
    loading,
    error
  }
} 