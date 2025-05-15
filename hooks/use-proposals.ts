import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Timestamp } from "firebase/firestore"

export interface Proposal {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  createdAt: string
  texts: {
    title: string
    content: string
  }[]
  requirements: string[]
}

function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchProposals() {
      try {
        const proposalsRef = collection(db, "essayThemes")
        const q = query(
          proposalsRef, 
          where("active", "==", true)
        )
        const querySnapshot = await getDocs(q)

        if (!mounted) return

        const proposalsData = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: formatDate(data.createdAt as Timestamp)
          }
        }) as Proposal[]

        // Ordenar por data no cliente
        proposalsData.sort((a, b) => {
          const dateA = new Date(a.createdAt.split('/').reverse().join('-'))
          const dateB = new Date(b.createdAt.split('/').reverse().join('-'))
          return dateB.getTime() - dateA.getTime()
        })

        setProposals(proposalsData)
      } catch (err) {
        console.error("Erro ao buscar propostas:", err)
        if (mounted) {
          setError("Erro ao carregar as propostas. Tente novamente mais tarde.")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Verifica se estamos no navegador antes de fazer a busca
    if (typeof window !== "undefined") {
      fetchProposals()
    }

    return () => {
      mounted = false
    }
  }, [])

  return { proposals, loading, error }
} 