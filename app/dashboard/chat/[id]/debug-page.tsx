"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Send, 
  Paperclip, 
  X, 
  Download, 
  FileText, 
  Image, 
  Music,
  ArrowLeft,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useChatTicketSimple, useSendMessageSimple } from "@/hooks/use-chat-tickets-simple"
import { useEssays } from "@/hooks/use-essays"
import { useAuth } from "@/lib/auth-context"
import { SubscriptionGuard } from "@/components/subscription-guard"
import { toast } from "sonner"
import { useLogger } from "@/lib/logger"
import { ChatMessage, ChatAttachment } from "@/lib/types"
import { useChatAttachments } from "@/hooks/use-chat-attachments"
import { AttachmentUploadProgress } from "@/components/attachment-upload-progress"
import { ChatAttachmentViewer } from "@/components/chat-attachment-viewer"

export default function ChatTicketDebugPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const { ticket, loading, error, refetch } = useChatTicketSimple(ticketId)
  const { essays } = useEssays({})
  const { user } = useAuth()
  const { sendMessage, loading: sendingMessage } = useSendMessageSimple()
  const { uploadProgress, validateFile, MAX_FILE_SIZE, MAX_FILES_PER_MESSAGE } = useChatAttachments()
  const log = useLogger('ChatTicketDebug', '/dashboard/chat/[id]/debug')

  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de debug chat ticket carregada', {
      metadata: { theme: 'light_forced', ticketId }
    })
  }, [ticketId])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSendMessage = async () => {
    console.log('handleSendMessage DEBUG chamado:', { message, attachments: attachments.length, ticketId })
    
    if (!message.trim() && attachments.length === 0) {
      console.log('Mensagem vazia e sem anexos, retornando')
      return
    }

    try {
      console.log('Enviando mensagem DEBUG...')
      await sendMessage(ticketId, message.trim(), attachments.length > 0 ? attachments : undefined)
      console.log('Mensagem enviada com sucesso DEBUG')
      setMessage("")
      setAttachments([])
      
      // Recarregar o ticket após enviar a mensagem
      console.log('Recarregando ticket...')
      await refetch()
    } catch (error) {
      console.error('Erro ao enviar mensagem DEBUG:', error)
      toast.error("Erro ao enviar mensagem. Tente novamente.")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Verificar limite de arquivos
    if (attachments.length + files.length > MAX_FILES_PER_MESSAGE) {
      toast.error(`Máximo de ${MAX_FILES_PER_MESSAGE} arquivos por mensagem`)
      return
    }
    
    const validFiles = files.filter(file => {
      const validationError = validateFile(file)
      if (validationError) {
        toast.error(validationError)
        return false
      }
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />
    if (type.includes('word')) return <FileText className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEssayTitle = (essayId?: string) => {
    if (!essayId) return "Chat Geral"
    const essay = essays.find(e => e.id === essayId)
    return essay?.theme?.title || "Redação não encontrada"
  }

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderId === user?.uid
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar chat: {error?.message || "Chat não encontrado"}</p>
        <Button onClick={() => router.push('/dashboard/chat')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <SubscriptionGuard requiredPlan="private" feature="chat">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/chat')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg">{ticket.subject} [DEBUG]</CardTitle>
                  <p className="text-sm text-gray-600">
                    {ticket.essayId ? `Redação: ${getEssayTitle(ticket.essayId)}` : 'Chat Geral'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
                <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                  {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="max-h-[500px] overflow-y-auto">
            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage(msg) 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs opacity-75">
                        {formatDate(msg.timestamp)}
                      </span>
                      {msg.read && (
                        <span className="text-xs opacity-75">✓</span>
                      )}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((attachment: ChatAttachment) => (
                          <ChatAttachmentViewer
                            key={attachment.id}
                            attachment={attachment}
                            isOwnMessage={isOwnMessage(msg)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          {ticket.status === 'open' && (
            <div className="border-t p-4">
              {/* Upload Progress */}
              <AttachmentUploadProgress uploadProgress={uploadProgress} />
              
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-sm"
                    >
                      {getFileIcon(file.type)}
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-4 w-4 p-0"
                        disabled={sendingMessage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendingMessage}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={sendingMessage}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!message.trim() && attachments.length === 0) || sendingMessage}
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,audio/*,video/*,.zip,.rar"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </Card>
      </div>
    </SubscriptionGuard>
  )
} 