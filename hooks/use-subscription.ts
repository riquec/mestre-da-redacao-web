import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Subscription } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(subscriptionsRef, where('userId', '==', user.uid))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const subscriptionDoc = querySnapshot.docs[0]
          setSubscription({ id: subscriptionDoc.id, ...subscriptionDoc.data() } as Subscription)
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  return { subscription, loading, error }
} 