"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Inbox, Clock, Video, FileText, AlertCircle, MessageSquare, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useProfessorCorrections } from "@/hooks/use-professor-corrections"
import { useProfessorProposals } from "@/hooks/use-professor-proposals"
import { useState } from "react"
import { useEssayThemes } from "@/hooks/use-essay-themes"

export default function ProfessorDashboard() {
  const { pendingCorrections, recentCorrections, loading, error } = useProfessorCorrections()
  const { proposals, loading: proposalsLoading, error: proposalsError } = useProfessorProposals()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const { themes } = useEssayThemes({ activeOnly: true })

  // Mock data - in a real app, this would come from your backend
  const dashboardData = {
    totalStudents: 156,
    totalVideos: 8,
    messages: [
      { id: 1, student: "Ana Souza", subject: "Dúvida sobre a correção", receivedAt: "3 horas atrás" },
      { id: 2, student: "Lucas Mendes", subject: "Feedback sobre proposta de intervenção", receivedAt: "1 dia atrás" },
    ],
  }

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setIsNavigating(true)
    setTimeout(() => {
      window.location.href = href
    }, 100)
  }

  const handleManage = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setIsManaging(true)
    setTimeout(() => {
      window.location.href = href
    }, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Erro ao carregar dados: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Professor</h1>
        <p className="text-gray-500">Bem-vindo ao seu painel de gerenciamento</p>
      </div>

      {pendingCorrections.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Você tem {pendingCorrections.length} correções pendentes. Por favor, priorize-as.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Correções pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{pendingCorrections.length}</p>
              </div>
              <Link href="/professor/dashboard/correcoes">
                <Button size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Videoaulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{dashboardData.totalVideos}</p>
              </div>
              <Link href="/professor/dashboard/aulas" onClick={(e) => handleManage(e, "/professor/dashboard/aulas")}>
                <Button size="sm" variant="outline" disabled={isManaging}>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Propostas de redação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">
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
                <Button size="sm" variant="outline" disabled={isManaging || proposalsLoading}>
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
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
            <Inbox className="h-6 w-6" />
            <span>Corrigir redações</span>
          </Button>
        </Link>
        <Link href="/professor/dashboard/aulas/nova">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
            <Video className="h-6 w-6" />
            <span>Nova videoaula</span>
          </Button>
        </Link>
        <Link href="/professor/dashboard/propostas/nova" onClick={(e) => handleNavigation(e, "/professor/dashboard/propostas/nova")}>
          <Button 
            variant="outline" 
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
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
        <Card>
          <CardHeader>
            <CardTitle>Mensagens</CardTitle>
            <CardDescription>Dúvidas e feedbacks dos alunos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.messages.map((message) => (
                <div key={message.id} className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-md p-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{message.subject}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">De: {message.student}</p>
                      <Badge variant="outline">{message.receivedAt}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardData.messages.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <p>Nenhuma mensagem no momento</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full">
              Ver todas as mensagens
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
