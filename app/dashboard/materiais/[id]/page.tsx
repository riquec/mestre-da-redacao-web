"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { useLogger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/hooks/use-subscription"

export const dynamic = 'force-dynamic'

type Props = {
  params: { id: string }
}

type Material = {
  id: string
  name: string
  type: "file" | "folder"
  file?: {
    name: string
    url: string
    size: number
    type: string
  }
  createdAt?: { toDate: () => Date }
  parentId?: string | null
}

export default function MaterialDetalhePage({ params }: Props) {
  const router = useRouter()
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const log = useLogger('MaterialAluno', '/dashboard/materiais/[id]')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de detalhe do material carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced', materialId: params.id }
    })
  }, [log, params.id])

  // Verificar se o usuário tem acesso aos materiais
  const hasMaterialAccess = subscription?.type === 'mestre' || subscription?.type === 'private' || subscription?.type === 'partner'

  useEffect(() => {
    async function fetchMaterial() {
      setLoading(true)
      const ref = doc(db, "materials", params.id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setMaterial({ id: snap.id, ...snap.data() } as Material)
      } else {
        setMaterial(null)
      }
      setLoading(false)
    }
    fetchMaterial()
  }, [params.id])

  // Adicionar logs estruturados para debug de material
  useEffect(() => {
    log.info('Debug material', { action: 'debug', metadata: { material } })
    log.info('Debug subscription', { action: 'debug', metadata: { subscription, hasMaterialAccess } })
  }, [material, subscription, hasMaterialAccess, log])

  // Componente de bloqueio para usuários sem acesso
  if (!subscriptionLoading && !hasMaterialAccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Breadcrumbs simples */}
        <nav className="text-sm text-gray-500 flex items-center gap-2 mb-2">
          <Link href="/dashboard/materiais" className="hover:underline">Material didático</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700 font-medium">Acesso Restrito</span>
        </nav>

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
                onClick={() => router.push('/dashboard/materiais')}
              >
                Voltar aos Materiais
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]">Carregando...</div>
  }
  if (!material || material.type !== "file" || !material.file) {
    return <div className="text-center text-gray-500 py-12">Material não encontrado ou não é um arquivo PDF.</div>
  }

  // Data formatada
  const dataUpload = material.createdAt?.toDate ? material.createdAt.toDate().toLocaleDateString() : "-"

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Breadcrumbs simples */}
      <nav className="text-sm text-gray-500 flex items-center gap-2 mb-2">
        <Link href="/dashboard/materiais" className="hover:underline">Material didático</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">{material.name}</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight mb-2">{material.name}</h1>
      <div className="text-sm text-gray-500 mb-4">Enviado em: {dataUpload}</div>

      {/* Visualização do PDF */}
      <div className="w-full aspect-[4/3] bg-gray-100 rounded border flex items-center justify-center overflow-hidden mb-4">
        <iframe
          src={material.file.url + "#toolbar=1&navpanes=0&scrollbar=1"}
          title={material.name}
          className="w-full h-full min-h-[400px]"
          allowFullScreen
        />
      </div>

      <div className="flex gap-4">
        <a
          href={material.file.url}
          download={material.file.name}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        >
          Baixar PDF
        </a>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-semibold hover:bg-gray-300 transition"
          onClick={() => router.back()}
        >
          Voltar
        </button>
      </div>
    </div>
  )
} 