"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Folder as FolderIcon, FileText, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useLogger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"

type Breadcrumb = { id: string | null; name: string }

export default function MateriaisAlunoPage() {
  const router = useRouter()
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: "Material didático" }])
  const [materiais, setMateriais] = useState<any[]>([])
  const [loadingMateriais, setLoadingMateriais] = useState(true)
  const [search, setSearch] = useState("")
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const log = useLogger('MateriaisAluno', '/dashboard/materiais')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de materiais carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced', pasta: currentFolder }
    })
  }, [log, currentFolder])

  // Verificar se o usuário tem acesso aos materiais
  const hasMaterialAccess = subscription?.type === 'mestre' || subscription?.type === 'private' || subscription?.type === 'partner'

  // Buscar materiais do Firestore ao carregar ou mudar de pasta
  useEffect(() => {
    async function fetchMateriais() {
      setLoadingMateriais(true)
      try {
        const q = currentFolder
          ? query(collection(db, "materials"), where("parentId", "==", currentFolder))
          : query(collection(db, "materials"), where("parentId", "==", null))
        const snap = await getDocs(q)
        setMateriais(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        setMateriais([])
      } finally {
        setLoadingMateriais(false)
      }
    }
    fetchMateriais()
  }, [currentFolder])

  // Adicionar logs estruturados para debug de materiais
  useEffect(() => {
    log.info('Debug materiais', { action: 'debug', metadata: { materiais } })
    log.info('Debug subscription', { action: 'debug', metadata: { subscription, hasMaterialAccess } })
  }, [materiais, subscription, hasMaterialAccess, log])

  // Filtrar materiais pelo nome
  const materiaisFiltrados = materiais.filter(mat =>
    mat.name?.toLowerCase().includes(search.toLowerCase())
  )

  // Navegação entre pastas
  const handleOpenFolder = useCallback((folder: { id: string; name: string }) => {
    setCurrentFolder(folder.id)
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }, [])

  // Voltar para uma pasta anterior pelo breadcrumb
  const handleBreadcrumbClick = (idx: number) => {
    const bc = breadcrumbs[idx]
    setCurrentFolder(bc.id)
    setBreadcrumbs(breadcrumbs.slice(0, idx + 1))
  }

  // Navegar para detalhes do arquivo
  const handleOpenFile = (fileId: string) => {
    router.push(`/dashboard/materiais/${fileId}`)
  }

  // Componente de bloqueio para usuários sem acesso
  if (!subscriptionLoading && !hasMaterialAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material didático</h1>
          <p className="text-gray-500">Acesse materiais exclusivos para aprimorar seus estudos</p>
        </div>

        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Acesso Restrito</h3>
              <p className="text-gray-600 max-w-md">
                O material didático está disponível apenas para alunos do Plano Mestre ou alunos parceiros.
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
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 mb-4 mt-2">
        {breadcrumbs.map((bc, idx) => (
          <span key={bc.id || "root"} className="flex items-center gap-1">
            {idx > 0 && <span className="mx-1">/</span>}
            <button
              className="hover:underline"
              onClick={() => handleBreadcrumbClick(idx)}
              disabled={idx === breadcrumbs.length - 1}
            >
              {bc.name}
            </button>
          </span>
        ))}
      </nav>

      <h1 className="text-3xl font-bold tracking-tight mb-6">Material didático</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Input
          placeholder="Buscar material..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingMateriais ? (
              <div className="col-span-full text-center text-gray-400 py-8">Carregando materiais...</div>
            ) : materiais.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-8">Nenhum material encontrado</div>
            ) : (
              materiaisFiltrados.map((mat) => (
                <div
                  key={mat.id}
                  className="flex items-center gap-3 p-5 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition"
                  onClick={mat.type === "folder" ? () => handleOpenFolder(mat) : () => handleOpenFile(mat.id)}
                >
                  {mat.type === "folder" ? (
                    <FolderIcon className="h-7 w-7 text-blue-600" />
                  ) : (
                    <FileText className="h-7 w-7 text-gray-500" />
                  )}
                  <span className="font-medium text-lg truncate">{mat.name}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 