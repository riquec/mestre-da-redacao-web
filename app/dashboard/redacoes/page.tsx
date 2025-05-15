"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, orderBy, getDocs, doc, getDoc, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Tag } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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

export default function Redacoes() {
  const router = useRouter()
  const { user } = useAuth()
  const [essays, setEssays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEssaysAndThemes() {
      if (!user) return

      // Buscar todas as redações do usuário
      const essaysRef = collection(db, "essays")
      const q = query(
        essaysRef,
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      const essaysData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Para cada redação, buscar o título do tema
      const essaysWithThemeTitle = await Promise.all(
        essaysData.map(async (essay: any) => {
          let themeTitle = "Tema não encontrado"
          if (essay.themeId) {
            const themeRef = doc(db, "essayThemes", essay.themeId)
            const themeDoc = await getDoc(themeRef)
            if (themeDoc.exists()) {
              const themeData = themeDoc.data()
              themeTitle = themeData.title || themeTitle
            }
          }
          return { ...essay, themeTitle }
        })
      )

      setEssays(essaysWithThemeTitle)
      setLoading(false)
    }

    fetchEssaysAndThemes()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Redações</h1>
          <p className="text-gray-500">Gerencie suas redações enviadas</p>
        </div>
        <Link href="/dashboard/redacoes/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova redação
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {essays.map((essay) => (
          <Card key={essay.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{essay.themeTitle}</CardTitle>
                  <CardDescription>
                    Enviada em {essay.submittedAt?.toDate().toLocaleDateString()}
                  </CardDescription>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  essay.correction?.status === 'done' 
                    ? 'bg-green-100 text-green-800' 
                    : essay.correction?.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : essay.correction?.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {essay.correction?.status === 'done' 
                    ? 'Corrigida' 
                    : essay.correction?.status === 'pending'
                    ? 'Pendente'
                    : essay.correction?.status === 'rejected'
                    ? 'Rejeitada'
                    : 'Sem correção'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {essay.theme && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Tag className="h-4 w-4" />
                    <span>{essay.theme.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {essay.theme.labels.map((label: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>Arquivos anexados</span>
                {/* Nota alinhada à esquerda, na mesma linha */}
                {essay.correction?.score?.total !== undefined && (
                  <span className="ml-4 text-gray-700">
                    Nota: <span className="font-bold">{essay.correction.score.total}</span>
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/dashboard/redacoes/${essay.id}`)}
              >
                Ver detalhes
              </Button>
            </CardFooter>
          </Card>
        ))}

        {essays.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma redação enviada</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Envie sua primeira redação para começar a receber correções
              </p>
              <Link href="/dashboard/redacoes/nova" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Enviar redação
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 