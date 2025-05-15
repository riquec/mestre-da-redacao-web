"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, ArrowLeft, Edit, Trash2, Send, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { EssayTheme, Essay } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PropostaDetalhesClient({ params }: { params: any }) {
  console.log("=== DEBUG: Início do componente ===")
  console.log("Params recebidos:", JSON.stringify(params, null, 2))

  // Extrai o ID do objeto params
  let propostaId: string | null = null
  if (params?.id) {
    propostaId = params.id
  } else if (params?.value) {
    try {
      const parsedValue = JSON.parse(params.value)
      propostaId = parsedValue.id
    } catch (error) {
      console.error("Erro ao parsear params.value:", error)
    }
  }

  console.log("ID extraído:", propostaId)
  console.log("DB inicializado:", !!db)

  const router = useRouter()
  const { toast } = useToast()
  const { user, role } = useAuth()
  console.log("User:", user)
  console.log("Role:", role)

  const [proposta, setProposta] = useState<EssayTheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [redacoes, setRedacoes] = useState<Essay[]>([])

  const getBackUrl = () => {
    return role === "professor" 
      ? "/professor/dashboard/propostas"
      : "/dashboard/propostas"
  }

  useEffect(() => {
    console.log("=== DEBUG: Início do useEffect ===")
    
    async function fetchProposta() {
      try {
        if (!db) {
          console.error("DB não inicializado")
          throw new Error("Erro de conexão com o banco de dados")
        }

        // Verifica se temos um ID válido
        if (!propostaId) {
          console.error("=== DEBUG: ID inválido ===")
          console.error("ID extraído:", propostaId)
          setError("ID da proposta inválido")
          toast({
            title: "Erro",
            description: "O ID da proposta é inválido.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        console.log("=== DEBUG: Buscando proposta ===")
        console.log("ID da proposta:", propostaId)
        console.log("Tipo do ID:", typeof propostaId)
        console.log("Comprimento do ID:", propostaId.length)
        
        const docRef = doc(db, "essayThemes", propostaId)
        console.log("DocRef criado:", docRef)
        
        const docSnap = await getDoc(docRef)
        console.log("DocSnap recebido:", docSnap)
        console.log("DocSnap existe:", docSnap.exists())
        console.log("Dados do DocSnap:", docSnap.data())

        if (docSnap.exists()) {
          console.log("Proposta encontrada:", docSnap.data())
          const data = docSnap.data()
          if (!data) {
            throw new Error("Dados da proposta não encontrados")
          }
          setProposta({
            id: docSnap.id,
            ...data
          } as EssayTheme)
        } else {
          console.log("Proposta não encontrada")
          setError("Proposta não encontrada")
          toast({
            title: "Proposta não encontrada",
            description: "A proposta que você está procurando não existe.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("=== DEBUG: Erro ao carregar proposta ===")
        console.error("Erro completo:", error)
        console.error("Tipo do erro:", typeof error)
        console.error("Mensagem do erro:", error instanceof Error ? error.message : "Erro desconhecido")
        setError("Desculpe, não foi possível carregar os detalhes da proposta. Por favor, tente novamente mais tarde.")
        toast({
          title: "Erro ao carregar proposta",
          description: "Ocorreu um erro ao carregar os detalhes da proposta.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    async function fetchRedacoes() {
      if (!propostaId) return
      try {
        const q = query(collection(db, "essays"), where("themeId", "==", propostaId))
        const querySnapshot = await getDocs(q)
        const lista: Essay[] = []
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() } as Essay)
        })
        setRedacoes(lista)
      } catch (err) {
        console.error("Erro ao buscar redações submetidas:", err)
      }
    }

    // Verifica se o Firebase está inicializado antes de buscar os dados
    if (db) {
      fetchProposta()
      if (propostaId) {
        fetchRedacoes()
      }
    } else {
      console.error("Firebase não inicializado")
      setError("Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde.")
      setLoading(false)
    }
  }, [propostaId, router, toast])

  console.log("Estado atual:", { loading, proposta, error })

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await updateDoc(doc(db, 'essayThemes', propostaId!), {
        active: false
      })
      toast({
        title: "Proposta excluída",
        description: "A proposta foi excluída com sucesso.",
        variant: "default",
      })
      router.push(getBackUrl())
    } catch (error) {
      console.error("Erro ao excluir proposta:", error)
      toast({
        title: "Erro ao excluir proposta",
        description: "Ocorreu um erro ao excluir a proposta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    console.log("Renderizando loading state")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Ops! Algo deu errado</h2>
        <p className="text-gray-500 text-center max-w-md">{error}</p>
        <Button onClick={() => router.push(getBackUrl())}>
          Voltar para lista de propostas
        </Button>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900">Proposta não encontrada</h2>
        <p className="text-gray-500 text-center max-w-md">
          A proposta que você está procurando não existe ou foi removida.
        </p>
        <Button onClick={() => router.push(getBackUrl())}>
          Voltar para lista de propostas
        </Button>
      </div>
    )
  }

  console.log("Renderizando conteúdo da proposta")
  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold mb-2">{proposta.title}</h1>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold">Categoria:</span> {proposta.category === 'ENEM_MESTRE' ? 'ENEM (Mestre da Redação)' : proposta.category === 'ENEM_PASSADO' ? 'ENEM (Edições passadas)' : proposta.category}
          </div>
          <div>
            <span className="font-semibold">Criada em:</span> {proposta.createdAt?.toDate().toLocaleDateString()}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {proposta.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <span className="font-semibold block mb-2">Arquivo da proposta:</span>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-400" />
            <span className="font-medium text-sm">{proposta.file.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(proposta.file.url, '_blank')}
            >
              Baixar
            </Button>
          </div>
          {(() => {
            const fileName = proposta.file.name || ''
            const fileUrl = proposta.file.url || ''
            const lowerName = fileName.toLowerCase()
            const lowerUrl = fileUrl.toLowerCase()
            const isPdf = lowerName.endsWith('.pdf') || lowerUrl.endsWith('.pdf')
            const isImage = ['.jpg', '.jpeg', '.png', '.gif'].some(ext => lowerName.endsWith(ext) || lowerUrl.endsWith(ext))
            const isTxt = lowerName.endsWith('.txt') || lowerUrl.endsWith('.txt')
            const isDoc = ['.doc', '.docx'].some(ext => lowerName.endsWith(ext) || lowerUrl.endsWith(ext))
            if (isPdf) {
              return (
                <div className="mt-4">
                  <iframe
                    src={`${proposta.file.url}#toolbar=0`}
                    className="w-full h-[500px] rounded-md border"
                    title={proposta.file.name}
                    allow="autoplay"
                  />
                </div>
              )
            } else if (isImage) {
              return (
                <div className="mt-4">
                  <img
                    src={proposta.file.url}
                    alt={proposta.file.name}
                    className="max-h-[500px] w-auto rounded-md border mx-auto"
                  />
                </div>
              )
            } else if (isTxt) {
              return (
                <div className="mt-4">
                  <iframe
                    src={proposta.file.url}
                    className="w-full h-[500px] rounded-md border bg-white"
                    title={proposta.file.name}
                  />
                </div>
              )
            } else if (isDoc) {
              return (
                <div className="mt-4 text-gray-500 text-sm">
                  Pré-visualização não suportada para arquivos Word. Faça o download para visualizar.
                </div>
              )
            } else {
              return (
                <div className="mt-4 text-gray-500 text-sm">
                  Tipo de arquivo não suportado para pré-visualização. Faça o download para visualizar.
                </div>
              )
            }
          })()}
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 