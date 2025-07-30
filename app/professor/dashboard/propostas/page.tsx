"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Edit, Trash2, Plus, Search, MoreVertical, CheckCircle, Loader2, Folder, ArrowLeft } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEssayThemes } from "@/hooks/use-essay-themes"
import { useToast } from "@/components/ui/use-toast"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
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

// Definir as categorias e seus nomes de exibição
const CATEGORY_FOLDERS = {
  'ENEM_MESTRE': 'Temas elaborados pelo Mestre',
  'ENEM_PASSADO': 'Temas ENEM anos anteriores'
}

export default function ProfessorPropostas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { themes, loading, error } = useEssayThemes({ searchTerm })
  const { toast } = useToast()
  const router = useRouter()

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    console.log('Página de propostas do professor carregada')
  }, [])

  const handleDelete = async (id: string) => {
    try {
      console.log('Excluindo proposta:', id)
      setDeletingId(id)
      await deleteDoc(doc(db, 'essayThemes', id))
      setShowDeleteDialog(false)
      setSelectedThemeId(null)
      setDeletingId(null)
      console.log('Proposta excluída com sucesso')
      toast({
        title: "Proposta excluída",
        description: "A proposta foi excluída com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir proposta:", error)
      toast({
        title: "Erro ao excluir proposta",
        description: "Ocorreu um erro ao excluir a proposta. Tente novamente.",
        variant: "destructive",
      })
      setDeletingId(null)
      setShowDeleteDialog(false)
      setSelectedThemeId(null)
    }
  }

  const handleViewDetails = async (id: string) => {
    try {
      console.log('Navegando para detalhes da proposta:', id)
      setLoadingDetails(id)
      await router.push(`/professor/dashboard/propostas/${id}`)
    } catch (error) {
      console.error("Erro ao navegar para detalhes:", error)
      toast({
        title: "Erro ao carregar detalhes",
        description: "Ocorreu um erro ao carregar os detalhes da proposta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoadingDetails(null)
    }
  }

  // Agrupar propostas por categoria
  const groupedThemes = themes.reduce((acc, theme) => {
    const category = theme.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(theme)
    return acc
  }, {} as Record<string, typeof themes>)

  // Contar propostas por categoria
  const getCategoryCount = (category: string) => {
    return groupedThemes[category]?.length || 0
  }

  // Filtrar propostas da categoria selecionada
  const filteredThemes = selectedCategory ? (groupedThemes[selectedCategory] || []) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propostas de Redação</h1>
          <p className="text-gray-500">
            {selectedCategory 
              ? `Propostas da categoria: ${CATEGORY_FOLDERS[selectedCategory as keyof typeof CATEGORY_FOLDERS] || selectedCategory}`
              : "Gerencie as propostas de redação disponíveis na plataforma"
            }
          </p>
        </div>
        <Link href="/professor/dashboard/propostas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova proposta
          </Button>
        </Link>
      </div>

      {/* Breadcrumbs */}
      {selectedCategory && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => setSelectedCategory(null)}
            className="hover:text-gray-900 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para categorias
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título, categoria ou tag..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Exibir pastas das categorias ou propostas da categoria selecionada */}
      {!selectedCategory ? (
        <div className="space-y-6">
          {/* Pastas das categorias */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(CATEGORY_FOLDERS).map(([category, displayName]) => {
              const count = getCategoryCount(category)
              return (
                <Card 
                  key={category} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardContent className="flex items-center p-6">
                    <Folder className="h-8 w-8 text-blue-600 mr-4" />
                    <div className="flex-1">
                      <h3 className="font-medium">{displayName}</h3>
                      <p className="text-sm text-gray-500">{count} proposta{count !== 1 ? 's' : ''}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Propostas sem categoria mapeada */}
          {Object.keys(groupedThemes).filter(cat => !CATEGORY_FOLDERS[cat as keyof typeof CATEGORY_FOLDERS]).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Outras Propostas</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedThemes)
                  .filter(([category]) => !CATEGORY_FOLDERS[category as keyof typeof CATEGORY_FOLDERS])
                  .flatMap(([, themes]) => themes)
                  .map((theme) => (
          <Card key={theme.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge>{theme.category}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center text-red-600"
                      onClick={() => {
                        setSelectedThemeId(theme.id)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg mt-2">{theme.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 flex-grow">
              <div className="flex flex-wrap gap-1 mb-4">
                {theme.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Criada em {theme.createdAt?.toDate().toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleViewDetails(theme.id)}
                disabled={loadingDetails === theme.id}
              >
                {loadingDetails === theme.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
            </div>
          )}
        </div>
      ) : (
        /* Propostas da categoria selecionada */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredThemes.map((theme) => (
            <Card key={theme.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge>{theme.category}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex items-center text-red-600"
                        onClick={() => {
                          setSelectedThemeId(theme.id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-2">{theme.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <div className="flex flex-wrap gap-1 mb-4">
                  {theme.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Criada em {theme.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleViewDetails(theme.id)}
                  disabled={loadingDetails === theme.id}
                >
                  {loadingDetails === theme.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}

          {filteredThemes.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              <p>Nenhuma proposta encontrada nesta categoria</p>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open)
        if (!open) {
          setSelectedThemeId(null)
          setDeletingId(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedThemeId && handleDelete(selectedThemeId)}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
