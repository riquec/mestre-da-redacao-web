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
import { useLogger } from "@/lib/logger"
// Sistema de logs simplificado

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
  const logger = useLogger('ProposalDetails', `/dashboard/propostas/${id}`)

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    console.log('Página de detalhes da proposta carregada:', { proposal_id: id })
  }, [id])

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        logger.info('Iniciando busca da proposta', {
          action: 'fetch_proposal_start',
          metadata: { proposal_id: id }
        })

        const docRef = doc(db, "essayThemes", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const proposalData = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Proposal

          setProposal(proposalData)
          
          logger.info('Proposta carregada com sucesso', {
            action: 'fetch_proposal_success',
            metadata: {
              proposal_id: id,
              title: proposalData.title,
              category: proposalData.category,
              has_file: !!proposalData.file,
              has_example: !!proposalData.example
            }
          })
        } else {
          logger.error('Proposta não encontrada', new Error('fetch_proposal_not_found'), { action: 'fetch_proposal_not_found', metadata: { proposal_id: id } })

          toast({
            title: "Proposta não encontrada",
            description: "A proposta que você está procurando não existe.",
            variant: "destructive",
          })
        }
      } catch (error) {
        logger.error('Erro ao carregar proposta', error instanceof Error ? error : new Error('fetch_proposal_error'), { 
          action: 'fetch_proposal_error',
          metadata: {
            proposal_id: id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })

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

  const handleSubmitEssay = () => {
    logger.info('Botão enviar redação clicado', {
      action: 'submit_essay_click',
      metadata: {
        proposal_id: id,
        proposal_title: proposal?.title
      }
    })

    router.push(`/dashboard/redacoes/nova?themeId=${id}`)
  }

  const handleBackToProposals = () => {
    logger.info('Voltar para propostas clicado', {
      action: 'back_to_proposals_click',
      metadata: { proposal_id: id }
    })

    router.push("/dashboard/propostas")
  }

  const handleDownloadFile = () => {
    logger.info('Download do arquivo da proposta', {
      action: 'download_proposal_file',
      metadata: {
        proposal_id: id,
        file_name: proposal?.file?.name
      }
    })

    if (proposal?.file?.url) {
      window.open(proposal.file.url, '_blank')
    }
  }

  const handleDownloadExample = () => {
    logger.info('Download do exemplo de redação', {
      action: 'download_example_essay',
      metadata: {
        proposal_id: id,
        example_name: proposal?.example?.name
      }
    })

    if (proposal?.example?.url) {
      window.open(proposal.example.url, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="bg-white min-h-screen">
        <div className="text-center py-10">
          <p className="text-gray-500">Proposta não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start bg-white">
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
                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-800">
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
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-medium shadow-md transition-all duration-200"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Redação
            </Button>
            <Button
              variant="ghost"
              onClick={handleBackToProposals}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para propostas
            </Button>
          </div>
        </div>

        {proposal.description && (
          <Card className="border-2 border-blue-100 bg-white">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">Descrição</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 bg-white">
              <p className="text-gray-700 leading-relaxed">{proposal.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Proposta de redação */}
        <Card className="border-2 border-blue-100 bg-white">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800">Proposta de redação</CardTitle>
            <CardDescription className="text-blue-600">Visualize ou baixe a proposta de redação</CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
              <span className="font-medium text-sm text-gray-900">{proposal.file?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFile}
                className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
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
                    className="w-full h-[500px] rounded-md border bg-white"
                    title={proposal.file.name}
                    allow="autoplay"
                  />
                );
              } else if (isImage) {
                return (
                  <img
                    src={proposal.file.url}
                    alt={proposal.file.name}
                    className="max-h-[500px] w-auto rounded-md border mx-auto bg-white"
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
                  <div className="mt-4 text-gray-500 text-sm bg-white p-4 rounded-md border">
                    Pré-visualização disponível apenas para arquivos PDF, imagem ou TXT.
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>

        {proposal.example && (
          <Card className="border-2 border-blue-100 bg-white">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">Exemplo de redação</CardTitle>
              <CardDescription className="text-blue-600">Redação nota mil para esta proposta</CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{proposal.example.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExample}
                  className="border-blue-200 hover:bg-blue-50 text-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 