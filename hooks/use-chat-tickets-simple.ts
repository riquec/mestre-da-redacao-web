import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ChatTicket, ChatMessage, ChatAttachment } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { useChatAttachments } from './use-chat-attachments'

// Versão simplificada sem real-time para debug
export function useChatTicketSimple(ticketId: string) {
  const [ticket, setTicket] = useState<ChatTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTicket = async () => {
    if (!ticketId) {
      setLoading(false)
      return
    }

    try {
      console.log('Buscando ticket simples:', ticketId)
      const ticketRef = doc(db, 'chatTickets', ticketId)
      const ticketDoc = await getDoc(ticketRef)
      
      if (ticketDoc.exists()) {
        const ticketData = { id: ticketDoc.id, ...ticketDoc.data() } as ChatTicket
        console.log('Ticket encontrado (simples):', { 
          id: ticketData.id, 
          messagesCount: ticketData.messages?.length || 0 
        })
        setTicket(ticketData)
      } else {
        console.log('Ticket não encontrado (simples)')
        setTicket(null)
      }
    } catch (err) {
      console.error('Erro ao buscar ticket (simples):', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  return { ticket, loading, error, refetch: fetchTicket }
}

export function useSendMessageSimple() {
  const { user } = useAuth()
  const { uploadAttachments } = useChatAttachments()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = async (ticketId: string, content: string, attachments?: File[]) => {
    console.log('useSendMessageSimple.sendMessage chamado:', { ticketId, content, attachmentsCount: attachments?.length })
    
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
          console.error('Erro no upload de anexos (simples):', uploadError)
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

      console.log('Buscando ticket no Firestore (simples):', ticketId)
      const ticketRef = doc(db, 'chatTickets', ticketId)
      const ticketDoc = await getDoc(ticketRef)
      
      if (!ticketDoc.exists()) {
        console.error('Ticket não encontrado (simples):', ticketId)
        throw new Error('Ticket não encontrado')
      }

      console.log('Ticket encontrado, atualizando mensagens (simples)...')
      const currentMessages = ticketDoc.data().messages || []
      const updatedMessages = [...currentMessages, message]

      console.log('Enviando updateDoc (simples):', { 
        messagesCount: updatedMessages.length, 
        lastMessageAt: Timestamp.now() 
      })

      await updateDoc(ticketRef, {
        messages: updatedMessages,
        lastMessageAt: Timestamp.now()
      })

      console.log('Mensagem enviada com sucesso (simples), messageId:', messageId)
      return messageId
    } catch (err) {
      console.error('Erro ao enviar mensagem (simples):', err)
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { sendMessage, loading, error }
} 