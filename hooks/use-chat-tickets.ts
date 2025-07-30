import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ChatTicket, ChatMessage, ChatAttachment } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { useChatAttachments } from './use-chat-attachments'

export function useChatTickets() {
  const { user, role } = useAuth()
  const [tickets, setTickets] = useState<ChatTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const ticketsRef = collection(db, 'chatTickets')
    const q = query(
      ticketsRef,
      where(role === 'student' ? 'userId' : 'professorId', '==', user.uid),
      orderBy('lastMessageAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatTicket[]
      
      setTickets(ticketsData)
      setLoading(false)
    }, (err) => {
      // Tratamento específico para erro de índice
      if (err.message.includes('requires an index') || err.message.includes('index')) {
        setError(new Error('Sistema temporariamente indisponível. Por favor, tente novamente em alguns instantes.'))
      } else {
        setError(new Error('Erro ao carregar chats. Tente novamente.'))
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { tickets, loading, error }
}

export function useChatTicket(ticketId: string) {
  const [ticket, setTicket] = useState<ChatTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!ticketId) {
      setLoading(false)
      return
    }

    const ticketRef = doc(db, 'chatTickets', ticketId)
    
    const unsubscribe = onSnapshot(ticketRef, (doc) => {
      console.log('onSnapshot disparado para ticket:', ticketId, 'exists:', doc.exists())
      if (doc.exists()) {
        const ticketData = { id: doc.id, ...doc.data() } as ChatTicket
        console.log('Ticket atualizado:', { 
          id: ticketData.id, 
          messagesCount: ticketData.messages?.length || 0,
          lastMessageAt: ticketData.lastMessageAt 
        })
        setTicket(ticketData)
      } else {
        console.log('Ticket não encontrado')
        setTicket(null)
      }
      setLoading(false)
    }, (err) => {
      console.error('Erro no onSnapshot:', err)
      setError(err as Error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [ticketId])

  return { ticket, loading, error }
}

export function useCreateChatTicket() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createTicket = async (data: {
    essayId?: string  // Tornando opcional
    professorId: string
    subject: string
  }) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    setLoading(true)
    setError(null)

    try {
      const ticketData = {
        essayId: data.essayId || null,  // Pode ser null se não fornecido
        userId: user.uid,
        professorId: data.professorId,
        status: 'open' as const,
        subject: data.subject,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        messages: []
      }

      const docRef = await addDoc(collection(db, 'chatTickets'), ticketData)
      return docRef.id
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createTicket, loading, error }
}

export function useSendMessage() {
  const { user } = useAuth()
  const { uploadAttachments } = useChatAttachments()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = async (ticketId: string, content: string, attachments?: File[]) => {
    console.log('useSendMessage.sendMessage chamado:', { ticketId, content, attachmentsCount: attachments?.length })
    
    if (!user) throw new Error('Usuário não autenticado')
    
    setLoading(true)
    setError(null)

    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Upload attachments using the new hook
      let uploadedAttachments: ChatAttachment[] = []
      if (attachments && attachments.length > 0) {
        try {
          uploadedAttachments = await uploadAttachments(attachments)
        } catch (uploadError) {
          console.error('Erro no upload de anexos:', uploadError)
          throw new Error(`Falha no upload de anexos: ${uploadError instanceof Error ? uploadError.message : 'Erro desconhecido'}`)
        }
      }

      const message: ChatMessage = {
        id: messageId,
        senderId: user.uid,
        content,
        timestamp: Timestamp.now(),
        read: false,
        ...(uploadedAttachments.length > 0 && { attachments: uploadedAttachments })
      }

      console.log('Buscando ticket no Firestore:', ticketId)
      const ticketRef = doc(db, 'chatTickets', ticketId)
      const ticketDoc = await getDoc(ticketRef)
      
      if (!ticketDoc.exists()) {
        console.error('Ticket não encontrado:', ticketId)
        throw new Error('Ticket não encontrado')
      }

      console.log('Ticket encontrado, atualizando mensagens...')
      const currentMessages = ticketDoc.data().messages || []
      const updatedMessages = [...currentMessages, message]

      console.log('Enviando updateDoc:', { 
        messagesCount: updatedMessages.length, 
        lastMessageAt: Timestamp.now() 
      })

      await updateDoc(ticketRef, {
        messages: updatedMessages,
        lastMessageAt: Timestamp.now()
      })

      console.log('Mensagem enviada com sucesso, messageId:', messageId)
      return messageId
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { sendMessage, loading, error }
}

export function useCloseTicket() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const closeTicket = async (ticketId: string) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    setLoading(true)
    setError(null)

    try {
      const ticketRef = doc(db, 'chatTickets', ticketId)
      await updateDoc(ticketRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
        closedBy: user.uid
      })
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { closeTicket, loading, error }
}

export function useMarkMessagesAsRead() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const markAsRead = async (ticketId: string) => {
    if (!user) return
    
    console.log('markAsRead chamado para ticket:', ticketId)
    setLoading(true)

    try {
      const ticketRef = doc(db, 'chatTickets', ticketId)
      const ticketDoc = await getDoc(ticketRef)
      
      if (!ticketDoc.exists()) {
        console.log('Ticket não existe para markAsRead')
        return
      }

      const currentMessages = ticketDoc.data().messages || []
      console.log('markAsRead - mensagens atuais:', currentMessages.length)
      
      const updatedMessages = currentMessages.map((msg: ChatMessage) => {
        if (msg.senderId !== user.uid) {
          return { ...msg, read: true }
        }
        return msg
      })

      console.log('markAsRead - atualizando mensagens:', updatedMessages.length)
      await updateDoc(ticketRef, {
        messages: updatedMessages
      })
      console.log('markAsRead - concluído')
    } catch (err) {
      console.error('Erro ao marcar mensagens como lidas:', err)
    } finally {
      setLoading(false)
    }
  }

  return { markAsRead, loading }
} 