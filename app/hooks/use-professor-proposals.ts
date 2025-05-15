import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './use-auth'

export function useProfessorProposals() {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchProposals() {
      if (!user) return

      try {
        const proposalsRef = collection(db, 'proposals')
        const q = query(proposalsRef, where('professorId', '==', user.uid))
        const querySnapshot = await getDocs(q)
        
        const proposalsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setProposals(proposalsData)
      } catch (err) {
        setError('Erro ao carregar propostas')
        console.error('Erro ao buscar propostas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [user])

  return {
    proposals,
    loading,
    error
  }
} 