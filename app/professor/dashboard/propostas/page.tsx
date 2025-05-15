"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Edit, Trash2, Plus, Search, MoreVertical, CheckCircle, Loader2 } from "lucide-react"
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

export default function ProfessorPropostas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { themes, loading, error } = useEssayThemes({ searchTerm })
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await deleteDoc(doc(db, 'essayThemes', id))
      setShowDeleteDialog(false)
      setSelectedThemeId(null)
      setDeletingId(null)
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
          <p className="text-gray-500">Gerencie as propostas de redação disponíveis na plataforma</p>
        </div>
        <Link href="/professor/dashboard/propostas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova proposta
          </Button>
        </Link>
      </div>

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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
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

      {themes.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>Nenhuma proposta encontrada</p>
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
            <AlertDialogTitle>Excluir proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDelete(selectedThemeId!)}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
