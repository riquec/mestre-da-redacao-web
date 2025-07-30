"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Play, CheckCircle, Lock, Video } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useLogger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"

export default function Aulas() {
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [watchedMap, setWatchedMap] = useState<{ [lessonId: string]: boolean }>({})
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const log = useLogger('AulasAluno', '/dashboard/aulas')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de aulas carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  // Verificar se o usuário tem acesso às videoaulas
  const hasVideoAccess = subscription?.type === 'mestre' || subscription?.type === 'private' || subscription?.type === 'partner'

  useEffect(() => {
    async function fetchLessons() {
      setLoading(true)
      try {
        const q = query(collection(db, "lessons"), where("active", "==", true), orderBy("createdAt", "desc"))
        const snap = await getDocs(q)
        const lessonsArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setLessons(lessonsArr)
        
        // Só buscar progresso se o usuário tiver acesso
        if (user && hasVideoAccess) {
          const progressSnaps = await Promise.all(
            lessonsArr.map(lesson => getDoc(doc(db, "lessonProgress", `${user.uid}_${lesson.id}`)))
          )
          const watchedObj: { [lessonId: string]: boolean } = {}
          lessonsArr.forEach((lesson, idx) => {
            watchedObj[lesson.id] = progressSnaps[idx].exists() && progressSnaps[idx].data().watched
          })
          setWatchedMap(watchedObj)
        }
      } catch (err) {
        setLessons([])
        setWatchedMap({})
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
  }, [user, hasVideoAccess])

  // Adicionar logs estruturados para debug de lessons
  useEffect(() => {
    log.info('Debug lessons', { action: 'debug', metadata: { lessons } })
    log.info('Debug watchedMap', { action: 'debug', metadata: { watchedMap } })
    log.info('Debug subscription', { action: 'debug', metadata: { subscription, hasVideoAccess } })
  }, [lessons, watchedMap, subscription, hasVideoAccess, log])

  // Filtro de busca
  const filteredLessons = lessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filtros adicionais (exemplo: todos, assistidos, não assistidos)
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>("all")
  const displayedLessons = filteredLessons.filter(lesson => {
    if (filter === "all") return true
    if (filter === "watched") return watchedMap[lesson.id]
    if (filter === "unwatched") return !watchedMap[lesson.id]
    return true
  })

  // Componente de bloqueio para usuários sem acesso
  if (!subscriptionLoading && !hasVideoAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videoaulas</h1>
          <p className="text-gray-500">Assista às aulas para aprimorar suas técnicas de redação</p>
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
                onClick={() => router.push('/dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Videoaulas</h1>
        <p className="text-gray-500">Assista às aulas para aprimorar suas técnicas de redação</p>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            className="pl-8 pr-2 py-2 border rounded w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-2.5 top-2.5 text-gray-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15Z"/></svg>
          </span>
        </div>
        <select
          className="border rounded px-2 py-2 text-sm"
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
        >
          <option value="all">Todas</option>
          <option value="watched">Assistidas</option>
          <option value="unwatched">Não assistidas</option>
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-8">Carregando aulas...</div>
        ) : displayedLessons.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Nenhuma aula encontrada</p>
          </div>
        ) : (
          displayedLessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/dashboard/aulas/${lesson.id}`)}
            >
            <div className="relative">
              <img
                src={lesson.thumbnail || "/placeholder.svg"}
                alt={lesson.title}
                className="w-full h-40 object-cover"
              />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 text-primary fill-primary" />
                </div>
                  {watchedMap[lesson.id] && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Assistido</span>
                  </div>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{lesson.title}</h3>
                    <Badge variant="outline">{lesson.duration ? `${Math.floor((lesson.duration || 0) / 60)} min` : "-"}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{lesson.description}</p>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  )
}
