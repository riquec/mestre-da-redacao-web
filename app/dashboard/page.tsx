"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useEssays } from "@/hooks/use-essays"
import { useLessons } from "@/hooks/use-lessons"
import { useChats } from "@/hooks/use-chats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Video, FileText, MessageSquare, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Essay {
  id: string
  status: string
  submittedAt: any
  correctedAt?: any
  correction?: {
    score: {
      coesaoTextual: number
      compreensaoProposta: number
      dominioNormaCulta: number
      propostaIntervencao: number
      selecaoArgumentos: number
      total: number
    }
    status: string
  }
  themeId: string
  theme?: {
    title: string
    category: string
    labels: string[]
  }
  files: { name: string; url: string }[]
}

interface Subscription {
  id: string
  userId: string
  planId: string
  type: "free" | "medium" | "master" | "master-plus" | "private" | "partner"
  status: "active" | "cancelled"
  createdAt: any
  updatedAt: any
  corrections: {
    total: number
    used: number
  }
  tokens: {
    unlimited: boolean
    available: number
  }
}

const PLANS = {
  free: {
    name: "Plano Básico",
    description: "Para conhecer a plataforma",
    corrections: 0
  },
  medium: {
    name: "Plano Médio",
    description: "Para praticar regularmente",
    corrections: 2
  },
  master: {
    name: "Plano Mestre",
    description: "Para quem busca excelência",
    corrections: 4
  },
  "master-plus": {
    name: "Plano Mestre++",
    description: "Experiência completa",
    corrections: 6
  }
}

// Função utilitária para nome e descrição do plano
function getPlanoInfo(type: string) {
  if (PLANS[type as keyof typeof PLANS]) {
    return {
      name: PLANS[type as keyof typeof PLANS].name,
      description: PLANS[type as keyof typeof PLANS].description
    }
  }
  if (type === 'private') {
    return {
      name: 'Aluno Privado',
      description: 'Acesso ilimitado por ser aluno particular.'
    }
  }
  if (type === 'partner') {
    return {
      name: 'Aluno Parceiro',
      description: 'Acesso ilimitado por parceria institucional.'
    }
  }
  return {
    name: 'Plano Desconhecido',
    description: 'Consulte o suporte.'
  }
}

function hasCorrectionStatus(correction: any): correction is { status: string } {
  return correction && typeof correction.status === 'string';
}

export default function Dashboard() {
  const router = useRouter()
  const { user, userName, loading: authLoading } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const { essays, loading: essaysLoading } = useEssays({ limit: 3 })
  const { lessons, progress, loading: lessonsLoading } = useLessons()
  const { chats, loading: chatsLoading } = useChats()

  const loading = authLoading || subscriptionLoading || essaysLoading || lessonsLoading || chatsLoading

  // Log para debug
  console.log('subscription:', subscription)
  console.log('essays:', essays)
  console.log('lessons:', lessons)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Proteção extra para plano
  const planoInfo = subscription?.type ? getPlanoInfo(subscription.type) : { name: 'Plano Básico', description: 'Para conhecer a plataforma' }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {userName || 'Usuário'}</h1>
        <p className="text-gray-500">Bem-vindo ao seu painel de redação</p>
      </div>

      {/* Plan Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Seu plano atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {planoInfo.name}
                </p>
                <p className="text-xs text-gray-500">
                  {planoInfo.description}
                </p>
              </div>
              <Button size="sm" variant="outline" className="px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white hover:bg-gray-50 transition" onClick={() => router.push("/dashboard/assinatura")}>Gerenciar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Correções disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">
                  {subscription?.tokens && (subscription.type === 'private' || subscription.type === 'partner' || subscription.tokens.unlimited)
                    ? 'Correções ilimitadas'
                    : subscription?.tokens
                      ? (typeof subscription.tokens.available === 'number' ? subscription.tokens.available : 0)
                      : '0'}
                </p>
                <p className="text-xs text-gray-500">Neste mês</p>
              </div>
              <Progress 
                value={subscription?.tokens && (subscription.type === 'private' || subscription.type === 'partner' || subscription.tokens.unlimited) ? 100 : (subscription?.tokens && subscription.tokens.available > 0 ? 100 : 0)} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Redações corrigidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {Array.isArray(essays) ? essays.filter(e => hasCorrectionStatus(e.correction as any) && (e.correction as any).status === 'done').length : 0}
                </p>
                <p className="text-xs text-gray-500">Total de correções</p>
              </div>
              <Link href="/dashboard/redacoes">
                <Button size="sm" variant="outline" className="px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white hover:bg-gray-50 transition">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/dashboard/redacoes/nova">
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-center gap-2 border-2 border-yellow-300 shadow-sm rounded-md font-semibold text-gray-800 bg-white hover:bg-yellow-50 transition"
          >
            <FileText className="h-6 w-6" />
            <span>Nova redação</span>
          </Button>
        </Link>
        <Link href="/dashboard/aulas">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white hover:bg-gray-50 transition">
            <Video className="h-6 w-6" />
            <span>Videoaulas</span>
          </Button>
        </Link>
        <Link href="/em-construcao">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white hover:bg-gray-50 transition">
            <MessageSquare className="h-6 w-6" />
            <span>Chat com professor</span>
          </Button>
        </Link>
        <Link href="/dashboard/propostas">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white hover:bg-gray-50 transition">
            <FileText className="h-6 w-6" />
            <span>Propostas de redação</span>
          </Button>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Aulas recentes</CardTitle>
            <CardDescription>Continue de onde parou</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(lessons) && lessons.slice(0, 3).map((lesson) => {
                if (!lesson) return null
                const lessonProgress = progress && progress[lesson.id]
                return (
                  <div key={lesson.id} className="flex items-start gap-4">
                    <div className="bg-gray-100 rounded-md p-2">
                      <Video className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{lesson.title || 'Sem título'}</p>
                        <Badge variant="outline">{lesson.duration ? Math.floor(lesson.duration / 60) : 0} min</Badge>
                      </div>
                      {lessonProgress && (
                        <Progress value={lessonProgress.progress} className="h-1" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/aulas">
              <Button variant="outline" className="w-full hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white transition">
                Ver todas as aulas
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Recent Essays */}
        <Card>
          <CardHeader>
            <CardTitle>Redações recentes</CardTitle>
            <CardDescription>Suas últimas redações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(essays) && essays.map((essay) => (
                essay && (
                  <div key={essay.id} className="flex items-start gap-4">
                    <div className="bg-gray-100 rounded-md p-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{essay.theme?.title || 'Tema não encontrado'}</p>
                        <Badge variant={hasCorrectionStatus(essay.correction as any) && (essay.correction as any).status === 'done' ? 'default' : 'outline'} className={hasCorrectionStatus(essay.correction as any) && (essay.correction as any).status === 'done' ? '' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50'}>
                          {hasCorrectionStatus(essay.correction as any) && (essay.correction as any).status === 'done' ? 'Corrigida' : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Enviada em {essay.submittedAt && essay.submittedAt.toDate ? essay.submittedAt.toDate().toLocaleDateString() : 'Data desconhecida'}
                      </p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/redacoes">
              <Button variant="outline" className="w-full hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-800 bg-white transition">
                Ver todas as redações
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
