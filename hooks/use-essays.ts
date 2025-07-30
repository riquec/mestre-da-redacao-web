import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Essay } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

export function useEssays(options: { limit?: number; status?: Essay['status'] } = {}) {
  const { user } = useAuth()
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchEssays() {
      if (!user) {
        console.log('useEssays: Usuário não autenticado')
        setLoading(false)
        return
      }

      try {
        console.log('useEssays: Iniciando busca de redações para usuário:', user.uid)
        const essaysRef = collection(db, 'essays')
        let q
        
        // Query simples - sempre buscar todas as redações do usuário
        q = query(
          essaysRef,
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        )

        if (options.limit) {
          q = query(q, limit(options.limit))
        }

        const querySnapshot = await getDocs(q)
        console.log('useEssays: Redações encontradas:', querySnapshot.size)

        const essaysData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const essayData = {
              id: docSnapshot.id,
              ...docSnapshot.data()
            } as Essay

            console.log('useEssays: Processando redação:', {
              id: essayData.id,
              themeId: essayData.themeId,
              dados: essayData
            })

            // Buscar informações do tema
            if (essayData.themeId) {
              console.log('useEssays: Buscando tema:', essayData.themeId)
              const themeRef = doc(db, "essayThemes", essayData.themeId)
              const themeDoc = await getDoc(themeRef)
              
              if (themeDoc.exists()) {
                const themeData = themeDoc.data() as DocumentData
                console.log('useEssays: Tema encontrado:', {
                  id: essayData.themeId,
                  dados: themeData
                })
                essayData.theme = {
                  title: themeData.title,
                  category: themeData.category,
                  labels: themeData.labels || []
                }
              } else {
                console.log('useEssays: Tema não encontrado:', essayData.themeId)
              }
            } else {
              console.log('useEssays: Redação sem themeId:', essayData.id)
            }

            return essayData
          })
        )

        console.log('useEssays: Redações processadas:', essaysData)
        setEssays(essaysData)
      } catch (err) {
        console.error('useEssays: Erro ao buscar redações:', err)
        
        // Tratamento específico para erro de índice
        if (err instanceof Error && (err.message.includes('requires an index') || err.message.includes('index'))) {
          setError(new Error('Sistema temporariamente indisponível. Por favor, tente novamente em alguns instantes.'))
        } else {
          setError(err as Error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEssays()
  }, [user, options.status, options.limit])

  return { essays, loading, error }
} 