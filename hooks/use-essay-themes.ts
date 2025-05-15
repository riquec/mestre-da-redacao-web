import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { EssayTheme } from "@/lib/types"

interface UseEssayThemesOptions {
  category?: string
  searchTerm?: string
  limit?: number
  activeOnly?: boolean
}

export function useEssayThemes(options: UseEssayThemesOptions = {}) {
  const { user } = useAuth()
  const [themes, setThemes] = useState<EssayTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let themesRef = collection(db, "essayThemes")
    let q = query(themesRef, orderBy("createdAt", "desc"))

    // Aplicar filtros
    if (options.category) {
      q = query(q, where("category", "==", options.category))
    }

    if (options.limit) {
      q = query(q, limit(options.limit))
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const themesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EssayTheme[]

        // Filtrar por active e searchTerm no cliente
        let filteredThemes = themesData

        if (options.activeOnly !== false) {
          filteredThemes = filteredThemes.filter(theme => theme.active)
        }

        if (options.searchTerm) {
          const searchLower = options.searchTerm.toLowerCase()
          filteredThemes = filteredThemes.filter(theme => 
            theme.title.toLowerCase().includes(searchLower) ||
            theme.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
            theme.category.toLowerCase().includes(searchLower)
          )
        }

        setThemes(filteredThemes)
        setLoading(false)
      },
      (error) => {
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, options.category, options.searchTerm, options.limit, options.activeOnly])

  const refetch = () => {
    setLoading(true)
  }

  return { themes, loading, error, refetch }
} 