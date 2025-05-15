"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send, FileText, Download, BookOpen, FileImage, FileVideo } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface ProposalDetailsProps {
  id: string
}

interface Proposal {
  id: string
  title: string
  description: string
  category: string
  year: number
  exam: string
  tags: string[]
  texts: Array<{
    title: string
    content: string
  }>
  files: Array<{ name: string; url: string }>
  example: { name: string; url: string } | null
  createdAt: Date
  updatedAt: Date
  active: boolean
  file?: { name: string; url: string }
}

export function ProposalDetails({ id }: ProposalDetailsProps) {
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const docRef = doc(db, "essayThemes", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProposal({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Proposal)
        } else {
          toast({
            title: "Proposta não encontrada",
            description: "A proposta que você está procurando não existe.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar proposta",
          description: "Ocorreu um erro ao carregar os detalhes da proposta.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [id, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!proposal) {
    return null
  }

  const handleSubmitEssay = () => {
    router.push(`/dashboard/redacoes/nova?themeId=${id}`)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-blue-700">
            {proposal.title}
          </h1>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Categoria:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {proposal.category === 'ENEM_MESTRE'
                  ? 'ENEM (Mestre da Redação)'
                  : proposal.category === 'ENEM_PASSADO'
                  ? 'ENEM (Edições passadas)'
                  : proposal.category}
              </Badge>
            </div>
            {proposal.year && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Ano:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {proposal.year}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {proposal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-gray-100">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSubmitEssay} 
            className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-medium shadow-md"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Redação
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/propostas")}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para propostas
          </Button>
        </div>
      </div>

      {proposal.description && (
        <Card className="border-2 border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800">Descrição</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">{proposal.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Proposta de redação */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800">Proposta de redação</CardTitle>
          <CardDescription>Visualize ou baixe a proposta de redação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-gray-400" />
            <span className="font-medium text-sm">{proposal.file?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(proposal.file?.url, '_blank')}
            >
              Baixar
            </Button>
          </div>
          {/* Pré-visualização do arquivo */}
          {proposal.file && proposal.file.url && (() => {
            const fileName = proposal.file?.name?.toLowerCase() || '';
            const fileUrl = proposal.file?.url?.toLowerCase() || '';
            const isPdf = fileName.endsWith('.pdf') || fileUrl.endsWith('.pdf');
            const isImage = ['.jpg', '.jpeg', '.png', '.gif'].some(ext => fileName.endsWith(ext) || fileUrl.endsWith(ext));
            const isTxt = fileName.endsWith('.txt') || fileUrl.endsWith('.txt');
            if (isPdf) {
              return (
                <iframe
                  src={`${proposal.file.url}#toolbar=0`}
                  className="w-full h-[500px] rounded-md border"
                  title={proposal.file.name}
                  allow="autoplay"
                />
              );
            } else if (isImage) {
              return (
                <img
                  src={proposal.file.url}
                  alt={proposal.file.name}
                  className="max-h-[500px] w-auto rounded-md border mx-auto"
                />
              );
            } else if (isTxt) {
              return (
                <iframe
                  src={proposal.file.url}
                  className="w-full h-[500px] rounded-md border bg-white"
                  title={proposal.file.name}
                />
              );
            } else {
              return (
                <div className="mt-4 text-gray-500 text-sm">
                  Pré-visualização disponível apenas para arquivos PDF, imagem ou TXT.
                </div>
              );
            }
          })()}
        </CardContent>
      </Card>

      {proposal.example && (
        <Card className="border-2 border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800">Exemplo de redação</CardTitle>
            <CardDescription>Redação nota mil para esta proposta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{proposal.example.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(proposal.example!.url, "_blank")}
                className="border-blue-200 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 