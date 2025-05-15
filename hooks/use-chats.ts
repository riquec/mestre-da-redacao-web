import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Chat } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

export function useChats() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchChats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const chatsRef = collection(db, 'chats')
        const q = query(
          chatsRef,
          where('userId', '==', user.uid),
          orderBy('lastMessage', 'desc')
        )

        const querySnapshot = await getDocs(q)
        const chatsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[]

        setChats(chatsData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [user])

  return { chats, loading, error }
} 