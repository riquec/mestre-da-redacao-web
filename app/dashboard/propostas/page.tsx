"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Send, Eye, Loader2, Folder, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useProposals } from "@/hooks/use-proposals"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

// Definir as categorias e seus nomes de exibição
const CATEGORY_FOLDERS = {
  'ENEM_MESTRE': 'Temas elaborados pelo Mestre',
  'ENEM_PASSADO': 'Temas ENEM anos anteriores'
}

export default function Propostas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingProposalId, setLoadingProposalId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { proposals, loading, error } = useProposals()
  const router = useRouter()

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    logger.info('Página de propostas carregada', {
      action: 'page_load',
      metadata: { 
        theme: 'light_forced',
        page: 'dashboard_propostas'
      }
    })
  }, [])

  // Log de debug dos dados
  useEffect(() => {
    if (proposals.length > 0) {
      logger.debug('Propostas carregadas', {
        action: 'data_loaded',
        metadata: {
          total_proposals: proposals.length,
          categories: Object.keys(CATEGORY_FOLDERS),
          has_error: !!error
        }
      })
    }
  }, [proposals, error])

  const handleSubmitEssay = (proposalId: string) => {
    logger.info('Botão enviar redação clicado', {
      action: 'submit_essay_click',
      metadata: {
        proposal_id: proposalId,
        category: selectedCategory
      }
    })
    
    setLoadingProposalId(proposalId)
    router.push(`/dashboard/redacoes/nova?themeId=${proposalId}`)
  }

  const handleViewDetails = (proposalId: string) => {
    logger.info('Botão ver detalhes clicado', {
      action: 'view_details_click',
      metadata: {
        proposal_id: proposalId,
        category: selectedCategory
      }
    })
    
    setLoadingProposalId(proposalId)
    router.push(`/dashboard/propostas/${proposalId}`)
  }

  const handleCategorySelect = (category: string) => {
    logger.info('Categoria selecionada', {
      action: 'category_select',
      metadata: {
        category: category,
        display_name: CATEGORY_FOLDERS[category as keyof typeof CATEGORY_FOLDERS]
      }
    })
    
    setSelectedCategory(category)
  }

  const handleBackToCategories = () => {
    logger.info('Voltar para categorias', {
      action: 'back_to_categories',
      metadata: {
        previous_category: selectedCategory
      }
    })
    
    setSelectedCategory(null)
  }

  const handleSearch = (term: string) => {
    logger.info('Busca realizada', {
      action: 'search',
      metadata: {
        search_term: term,
        category: selectedCategory,
        results_count: getFilteredProposals().length
      }
    })
    
    setSearchTerm(term)
  }

  // Agrupar propostas por categoria
  const groupedProposals = proposals.reduce((acc, proposal) => {
    const category = proposal.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(proposal)
    return acc
  }, {} as Record<string, typeof proposals>)

  // Contar propostas por categoria
  const getCategoryCount = (category: string) => {
    return groupedProposals[category]?.length || 0
  }

  // Filtrar propostas da categoria selecionada ou aplicar busca
  const getFilteredProposals = () => {
    let proposalsToFilter = selectedCategory 
      ? (groupedProposals[selectedCategory] || [])
      : proposals

    if (searchTerm) {
      proposalsToFilter = proposalsToFilter.filter(
    (proposta) =>
      proposta.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )
    }

    return proposalsToFilter
  }

  const filteredProposals = getFilteredProposals()

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        <div className="bg-white">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Propostas de Redação</h1>
          <p className="text-gray-500">
            {selectedCategory 
              ? `Propostas da categoria: ${CATEGORY_FOLDERS[selectedCategory as keyof typeof CATEGORY_FOLDERS] || selectedCategory}`
              : "Escolha uma proposta para começar sua redação"
            }
          </p>
        </div>

        {/* Breadcrumbs */}
        {selectedCategory && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white">
            <button
              onClick={handleBackToCategories}
              className="hover:text-gray-900 flex items-center transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para categorias
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por título, descrição ou tags..."
              className="pl-8 bg-white border-gray-300 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Exibir pastas das categorias ou propostas da categoria selecionada */}
        {!selectedCategory ? (
          <div className="space-y-6 bg-white">
            {/* Pastas das categorias */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(CATEGORY_FOLDERS).map(([category, displayName]) => {
                const count = getCategoryCount(category)
                return (
                  <Card 
                    key={category} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white border-gray-200 hover:border-blue-300"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardContent className="flex items-center p-6 bg-white">
                      <Folder className="h-8 w-8 text-blue-600 mr-4" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{displayName}</h3>
                        <p className="text-sm text-gray-500">{count} proposta{count !== 1 ? 's' : ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Propostas sem categoria mapeada */}
            {Object.keys(groupedProposals).filter(cat => !CATEGORY_FOLDERS[cat as keyof typeof CATEGORY_FOLDERS]).length > 0 && (
              <div className="bg-white">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Outras Propostas</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {loading ? (
                    // Loading skeletons
                    Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className="flex flex-col bg-white">
                        <CardHeader className="pb-2 bg-white">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16 mt-2" />
                        </CardHeader>
                        <CardContent className="flex-grow bg-white">
                          <Skeleton className="h-16 w-full" />
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 bg-white">
                          <Skeleton className="h-10 flex-1" />
                          <Skeleton className="h-10 flex-1" />
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    Object.entries(groupedProposals)
                      .filter(([category]) => !CATEGORY_FOLDERS[category as keyof typeof CATEGORY_FOLDERS])
                      .flatMap(([, proposals]) => proposals)
                      .map((proposta) => (
                        <Card key={proposta.id} className="flex flex-col bg-white border-gray-200 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2 bg-white">
                            <CardTitle className="text-xl text-gray-900">{proposta.title}</CardTitle>
                            <CardDescription className="line-clamp-2 text-gray-600">{proposta.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow bg-white">
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
                          <CardFooter className="flex gap-2 pt-0 bg-white">
                            <Button
                              variant="outline"
                              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
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
                              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-medium shadow-md transition-all duration-200"
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
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Propostas da categoria selecionada */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 bg-white">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col bg-white">
                <CardHeader className="pb-2 bg-white">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 mt-2" />
                </CardHeader>
                <CardContent className="flex-grow bg-white">
                  <Skeleton className="h-16 w-full" />
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 bg-white">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </CardFooter>
              </Card>
            ))
          ) : (
            filteredProposals.map((proposta) => (
              <Card key={proposta.id} className="flex flex-col bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-white">
                  <CardTitle className="text-xl text-gray-900">{proposta.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-gray-600">{proposta.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow bg-white">
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
                <CardFooter className="flex gap-2 pt-0 bg-white">
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
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
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-medium shadow-md transition-all duration-200"
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
            <Card className="col-span-full bg-white border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12 bg-white">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhuma proposta encontrada</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                    {selectedCategory 
                      ? "Nenhuma proposta encontrada nesta categoria"
                      : "Tente ajustar sua busca ou aguarde novas propostas"
                    }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
