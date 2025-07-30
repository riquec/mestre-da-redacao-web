'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Search, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useChatTickets, useCreateChatTicket } from '@/hooks/use-chat-tickets'
import { useEssays } from '@/hooks/use-essays'
import { useSubscription } from '@/hooks/use-subscription'
import { useLogger } from '@/lib/logger'
import { SubscriptionGuard } from '@/components/subscription-guard'
import { toast } from 'sonner'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function ChatPage() {
  const router = useRouter()
  const { tickets, loading, error } = useChatTickets()
  const { essays, loading: essaysLoading, error: essaysError } = useEssays()
  const { subscription } = useSubscription()
  const { createTicket, loading: creatingTicket } = useCreateChatTicket()
  const log = useLogger()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedEssay, setSelectedEssay] = useState<string>("")
  const [subject, setSubject] = useState("")

  // Verificar parâmetros da URL para pré-preencher o formulário
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const essayId = urlParams.get('essayId')
    const professorId = urlParams.get('professorId')
    const subjectParam = urlParams.get('subject')
    
    if (essayId && professorId && subjectParam) {
      setSelectedEssay(essayId)
      setSubject(subjectParam)
      setCreateDialogOpen(true)
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de chat do aluno carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Redações corrigidas disponíveis para chat
  const availableEssays = essays.filter(essay => {
    const hasCorrection = !!essay.correction
    const hasProfessor = essay.correction?.assignedTo
    
    console.log('Filtrando redação:', {
      id: essay.id,
      title: essay.theme?.title || 'Sem título',
      status: essay.status,
      hasCorrection,
      assignedTo: essay.correction?.assignedTo,
      hasProfessor,
      available: hasCorrection && hasProfessor
    })
    
    return hasCorrection && hasProfessor
  })

  console.log('Redações disponíveis para chat:', availableEssays.length, availableEssays)

  // Debug das redações
  useEffect(() => {
    log.info('Debug essays for chat', { 
      action: 'debug', 
      metadata: { 
        totalEssays: essays.length,
        essaysLoading,
        essaysError: essaysError?.message,
        availableEssays: availableEssays.length,
        essays: essays.map(e => ({
          id: e.id,
          title: e.theme?.title || 'Sem título',
          status: e.status,
          hasCorrection: !!e.correction,
          assignedTo: e.correction?.assignedTo,
          available: !!e.correction && !!e.correction?.assignedTo
        }))
      } 
    })
  }, [essays, essaysLoading, essaysError, availableEssays.length, log])

  const handleCreateTicket = async () => {
    if (!subject.trim()) {
      toast.error("Por favor, informe o assunto do chat.")
      return
    }

    try {
      let professorId: string
      
      if (selectedEssay && selectedEssay !== 'general') {
        // Se uma redação foi selecionada, usar o professor da redação
        const essay = availableEssays.find(e => e.id === selectedEssay)
        if (!essay?.correction?.assignedTo) {
          throw new Error("Professor não encontrado para esta redação")
        }
        professorId = essay.correction.assignedTo
      } else {
        // Se nenhuma redação foi selecionada ou é chat geral, buscar um professor disponível
        const usersRef = collection(db, "users")
        const professorsQuery = query(usersRef, where("role", "==", "professor"))
        const professorsSnapshot = await getDocs(professorsQuery)
        const professor = professorsSnapshot.docs[0]
        if (!professor) {
          throw new Error("Nenhum professor disponível no momento")
        }
        professorId = professor.id
      }

      const ticketData: {
        essayId?: string
        professorId: string
        subject: string
      } = {
        professorId,
        subject: subject.trim()
      }
      
      if (selectedEssay && selectedEssay !== 'general') {
        ticketData.essayId = selectedEssay
      }

      const ticketId = await createTicket(ticketData)

      toast.success("Chat criado com sucesso!")

      setCreateDialogOpen(false)
      setSelectedEssay("")
      setSubject("")
      
      // Redirecionar para o chat
      router.push(`/dashboard/chat/${ticketId}`)
    } catch (error) {
      toast.error("Erro ao criar chat. Tente novamente.")
      console.error('Erro ao criar chat ticket:', error)
    }
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
    if (!essayId) return 'Chat Geral'
    const essay = essays.find(e => e.id === essayId)
    return essay?.theme?.title || 'Redação'
  }

  if (loading || essaysLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar chats: {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (essaysError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar redações: {essaysError.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <SubscriptionGuard requiredPlan="private" feature="chat">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chat com Professor</h1>
            <p className="text-gray-600 mt-2">Tire suas dúvidas sobre as correções</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redação (Opcional)
                  </label>
                  <Select value={selectedEssay} onValueChange={setSelectedEssay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma redação corrigida ou deixe em branco para chat geral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Chat Geral (sem redação específica)</SelectItem>
                      {availableEssays.map((essay) => (
                        <SelectItem key={essay.id} value={essay.id}>
                          {essay.theme?.title || 'Redação sem título'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableEssays.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Nenhuma redação com correção disponível. Você pode criar um chat geral sem redação específica.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto
                  </label>
                  <Textarea
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Descreva sua dúvida ou questão..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateTicket} 
                    disabled={!subject.trim() || creatingTicket}
                  >
                    {creatingTicket ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Chat'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Chats */}
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tickets.length === 0 ? "Nenhum chat encontrado" : "Nenhum resultado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {tickets.length === 0 
                  ? "Você ainda não tem chats. Crie um novo chat para tirar dúvidas sobre suas correções."
                  : "Tente ajustar os filtros de busca."
                }
              </p>
                              {availableEssays.length === 0 && essays.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Nota:</strong> Você tem {essays.length} redação(ões), mas nenhuma está disponível para chat. 
                      Isso pode acontecer se a correção ainda não foi atribuída a um professor específico.
                    </p>
                  </div>
                )}
              {tickets.length === 0 && (
                <div className="space-y-2">
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Chat
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="ml-2"
                  >
                    Atualizar Página
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/chat/${ticket.id}`)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{ticket.subject}</h3>
                        <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                          {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {ticket.essayId ? `Redação: ${getEssayTitle(ticket.essayId)}` : 'Chat Geral'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Criado em {formatDate(ticket.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {ticket.messages.length} mensagem{ticket.messages.length !== 1 ? 'es' : ''}
                        </div>
                        {ticket.status === 'closed' && (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Fechado em {formatDate(ticket.closedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.status === 'open' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SubscriptionGuard>
  )
} 