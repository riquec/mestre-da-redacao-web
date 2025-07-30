"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Lock } from "lucide-react"
import { useLogger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"

export default function AulaPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [aula, setAula] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [assistido, setAssistido] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const log = useLogger('AulaAluno', '/dashboard/aulas/[id]')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de detalhe da aula carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced', aulaId: id }
    })
  }, [log, id])

  // Verificar se o usuário tem acesso às videoaulas
  const hasVideoAccess = subscription?.type === 'mestre' || subscription?.type === 'private' || subscription?.type === 'partner'

  useEffect(() => {
    async function fetchAula() {
      setLoading(true)
      try {
        const docSnap = await getDoc(doc(db, "lessons", id))
        if (docSnap.exists()) {
          setAula({ id: docSnap.id, ...docSnap.data() })
        }
        
        // Só buscar progresso se o usuário tiver acesso
        if (user && hasVideoAccess) {
          const progressSnap = await getDoc(doc(db, "lessonProgress", `${user.uid}_${id}`))
          if (progressSnap.exists() && progressSnap.data().watched) {
            setAssistido(true)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAula()
  }, [id, user, hasVideoAccess])

  // Adicionar logs estruturados para debug de aula e progresso
  useEffect(() => {
    log.info('Debug aula', { action: 'debug', metadata: { aula } })
    log.info('Debug assistido', { action: 'debug', metadata: { assistido } })
    log.info('Debug subscription', { action: 'debug', metadata: { subscription, hasVideoAccess } })
  }, [aula, assistido, subscription, hasVideoAccess, log])

  async function marcarComoAssistida() {
    if (!user) return
    
    setSaving(true)
    try {
      await setDoc(doc(db, "lessonProgress", `${user.uid}_${id}`), {
        userId: user.uid,
        lessonId: id,
        watched: true,
        watchedAt: new Date(),
      }, { merge: true })
      setAssistido(true)
      log.info('Aula marcada como assistida', { action: 'marcar_assistida', metadata: { aulaId: id, userId: user.uid } })
    } finally {
      setSaving(false)
    }
  }

  // Componente de bloqueio para usuários sem acesso
  if (!subscriptionLoading && !hasVideoAccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/aulas")}> 
            <ArrowLeft className="w-4 h-4" /> 
          </Button>
          <span className="cursor-pointer" onClick={() => router.push("/dashboard/aulas")}>Videoaulas</span>
          <span className="mx-1">/</span>
          <span className="font-medium text-gray-800">Acesso Restrito</span>
        </div>

        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Acesso Restrito</h3>
              <p className="text-gray-600 max-w-md">
                As videoaulas estão disponíveis apenas para alunos do Plano Mestre ou alunos parceiros.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/dashboard/plano')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ver Planos
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard/aulas')}
              >
                Voltar às Aulas
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) return <div className="py-10 text-center text-gray-400">Carregando aula...</div>
  if (!aula) return <div className="py-10 text-center text-gray-400">Aula não encontrada</div>

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/aulas")}> <ArrowLeft className="w-4 h-4" /> </Button>
        <span className="cursor-pointer" onClick={() => router.push("/dashboard/aulas")}>Videoaulas</span>
        <span className="mx-1">/</span>
        <span className="font-medium text-gray-800">{aula.title}</span>
      </div>
      <Card className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{aula.title}</h1>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{aula.duration ? `${Math.floor((aula.duration || 0) / 60)} min` : "-"}</Badge>
            <span className="text-xs text-gray-400">{aula.createdAt && aula.createdAt.toDate ? aula.createdAt.toDate().toLocaleDateString() : ""}</span>
            {assistido && <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="h-4 w-4" /> Assistida</span>}
          </div>
          <p className="text-gray-600 mb-4">{aula.description}</p>
        </div>
        {/* Player de vídeo */}
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
          {aula.videoUrl ? (
            <video src={aula.videoUrl} controls className="w-full h-full" poster={aula.thumbnail || undefined} />
          ) : (
            <span className="text-gray-400">Vídeo não disponível</span>
          )}
        </div>
        {/* Botão marcar como assistida */}
        {!assistido && (
          <Button onClick={marcarComoAssistida} disabled={saving} className="mt-4">
            {saving ? "Salvando..." : "Marcar como assistida"}
          </Button>
        )}
      </Card>
    </div>
  )
} 