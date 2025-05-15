import { useState, useEffect } from 'react'
import { collection, query, getDocs, orderBy, doc, getDoc, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Lesson, LessonProgress } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

export function useLessons() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLessons() {
      try {
        // Buscar todas as aulas
        const lessonsRef = collection(db, 'lessons')
        const q = query(lessonsRef, orderBy('createdAt', 'desc'))
        const querySnapshot = await getDocs(q)
        const lessonsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lesson[]

        setLessons(lessonsData)

        // Se houver usuário logado, buscar o progresso
        if (user) {
          const progressRef = collection(db, 'lessonProgress')
          const progressQuery = query(progressRef, where('userId', '==', user.uid))
          const progressSnapshot = await getDocs(progressQuery)
          
          const progressData = progressSnapshot.docs.reduce((acc, doc) => {
            const data = doc.data() as LessonProgress
            acc[data.lessonId] = { ...data, id: doc.id }
            return acc
          }, {} as Record<string, LessonProgress>)

          setProgress(progressData)
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [user])

  return { lessons, progress, loading, error }
} 