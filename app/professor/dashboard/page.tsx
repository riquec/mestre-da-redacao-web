"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Inbox, Clock, Video, FileText, AlertCircle, MessageSquare, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useProfessorCorrections } from "@/hooks/use-professor-corrections"
import { useProfessorProposals } from "@/hooks/use-professor-proposals"
import { useChatTickets } from "@/hooks/use-chat-tickets"
import { useState, useEffect } from "react"
import { useEssayThemes } from "@/hooks/use-essay-themes"
import { useAuth } from "@/lib/auth-context"

export default function ProfessorDashboard() {
  const { pendingCorrections, recentCorrections, loading, error } = useProfessorCorrections()
  const { proposals, loading: proposalsLoading, error: proposalsError } = useProfessorProposals()
  const { tickets, loading: ticketsLoading } = useChatTickets()
  const { user } = useAuth()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const { themes } = useEssayThemes({ activeOnly: true })

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    console.log('Dashboard do professor carregado')
  }, [])

  // Log de debug dos dados
  useEffect(() => {
    if (!loading && !error) {
      console.log('Dados do professor carregados:', {
        pending_corrections: pendingCorrections.length,
        recent_corrections: recentCorrections.length,
        total_proposals: proposals.length,
        themes_count: themes.length
      })
    }
  }, [loading, error, pendingCorrections, recentCorrections, proposals, themes])

  // Dados reais do Firestore
  const recentChats = tickets.slice(0, 5) // Últimos 5 chats
  
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Agora mesmo"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Agora mesmo"
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`
  }

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    console.log('Navegação iniciada:', { href })
    setIsNavigating(true)
    setTimeout(() => {
      window.location.href = href
    }, 100)
  }

  const handleManage = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    console.log('Gerenciamento iniciado:', { href })
    setIsManaging(true)
    setTimeout(() => {
      window.location.href = href
    }, 100)
  }

  const handleQuickAction = (action: string, href: string) => {
    console.log('Ação rápida clicada:', { action, href })
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="text-center py-10">
          <p className="text-red-500">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-8">
        <div className="bg-white">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Painel do Professor</h1>
          <p className="text-gray-500">Bem-vindo ao seu painel de gerenciamento</p>
        </div>

        {pendingCorrections.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-red-800">Atenção!</AlertTitle>
            <AlertDescription className="text-red-700">
              Você tem {pendingCorrections.length} correções pendentes. Por favor, priorize-as.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium text-gray-900">Correções pendentes</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{pendingCorrections.length}</p>
                </div>
                <Link href="/professor/dashboard/correcoes">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleQuickAction('view_corrections', '/professor/dashboard/correcoes')}
                  >
                    Ver todas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium text-gray-900">Videoaulas</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{themes.length}</p>
                </div>
                <Link href="/professor/dashboard/aulas" onClick={(e) => handleManage(e, "/professor/dashboard/aulas")}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={isManaging}
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                  >
                    {isManaging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Gerenciar"
                    )}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-white">
              <CardTitle className="text-sm font-medium text-gray-900">Propostas de redação</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">
                    {proposalsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : proposalsError ? (
                      <span className="text-red-500">Erro</span>
                    ) : (
                      proposals.length
                    )}
                  </p>
                </div>
                <Link href="/professor/dashboard/propostas" onClick={(e) => handleManage(e, "/professor/dashboard/propostas")}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={isManaging || proposalsLoading}
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                  >
                    {isManaging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Gerenciar"
                    )}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/professor/dashboard/correcoes">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-gray-300 transition-all duration-200"
              onClick={() => handleQuickAction('correct_essays', '/professor/dashboard/correcoes')}
            >
              <Inbox className="h-6 w-6" />
              <span>Corrigir redações</span>
            </Button>
          </Link>
          <Link href="/professor/dashboard/aulas/nova">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-gray-300 transition-all duration-200"
              onClick={() => handleQuickAction('new_lesson', '/professor/dashboard/aulas/nova')}
            >
              <Video className="h-6 w-6" />
              <span>Nova videoaula</span>
            </Button>
          </Link>
          <Link href="/professor/dashboard/propostas/nova" onClick={(e) => handleNavigation(e, "/professor/dashboard/propostas/nova")}>
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-gray-300 transition-all duration-200"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <FileText className="h-6 w-6" />
                  <span>Nova proposta</span>
                </>
              )}
            </Button>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Messages */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Mensagens</CardTitle>
              <CardDescription className="text-gray-600">Dúvidas e feedbacks dos alunos</CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-4">
                {recentChats.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                    onClick={() => window.location.href = `/professor/dashboard/chat/${ticket.id}`}
                  >
                    <div className={`rounded-md p-2 ${ticket.status === 'open' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <MessageSquare className={`h-5 w-5 ${ticket.status === 'open' ? 'text-green-500' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-gray-900">{ticket.subject}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {ticket.messages?.length || 0} mensagem{(ticket.messages?.length || 0) !== 1 ? 'es' : ''}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={ticket.status === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                          <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 text-xs">
                            {formatTimeAgo(ticket.lastMessageAt)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {recentChats.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p>Nenhum chat no momento</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-white">
              <Button 
                variant="ghost" 
                className="w-full bg-white hover:bg-gray-50 text-gray-900"
                onClick={() => window.location.href = '/professor/dashboard/chat'}
              >
                Ver todos os chats
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
