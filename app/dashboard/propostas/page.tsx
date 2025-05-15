"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Send, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useProposals } from "@/hooks/use-proposals"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export default function Propostas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingProposalId, setLoadingProposalId] = useState<string | null>(null)
  const { proposals, loading, error } = useProposals()
  const router = useRouter()

  const handleSubmitEssay = (proposalId: string) => {
    setLoadingProposalId(proposalId)
    router.push(`/dashboard/redacoes/nova?themeId=${proposalId}`)
  }

  const handleViewDetails = (proposalId: string) => {
    setLoadingProposalId(proposalId)
    router.push(`/dashboard/propostas/${proposalId}`)
  }

  const filteredProposals = proposals.filter(
    (proposta) =>
      proposta.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Propostas de Redação</h1>
        <p className="text-gray-500">Escolha uma proposta para começar sua redação</p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título, descrição ou tags..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16 mt-2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-16 w-full" />
                <div className="flex flex-wrap gap-2 mt-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </CardFooter>
            </Card>
          ))
        ) : (
          filteredProposals.map((proposta) => (
            <Card key={proposta.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{proposta.title}</CardTitle>
                <CardDescription className="line-clamp-2">{proposta.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <span className="px-3 py-1.5 bg-blue-900 text-white font-medium rounded-md text-sm">
                    {proposta.category === 'ENEM_MESTRE'
                      ? 'ENEM (Mestre da Redação)'
                      : proposta.category === 'ENEM_PASSADO'
                      ? 'ENEM (Edições passadas)'
                      : proposta.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {proposta.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  Criado em: {proposta.createdAt}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewDetails(proposta.id)}
                  disabled={loadingProposalId === proposta.id}
                >
                  {loadingProposalId === proposta.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  Ver detalhes
                </Button>
                <Button 
                  onClick={() => handleSubmitEssay(proposta.id)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-medium shadow-md"
                  disabled={loadingProposalId === proposta.id}
                >
                  {loadingProposalId === proposta.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar redação
                </Button>
              </CardFooter>
            </Card>
          ))
        )}

        {!loading && filteredProposals.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma proposta encontrada</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Tente ajustar sua busca ou aguarde novas propostas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
