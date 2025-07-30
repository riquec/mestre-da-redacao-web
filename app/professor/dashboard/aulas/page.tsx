"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Plus, Search, MoreVertical, Video } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore"
import { deleteObject, ref as storageRef } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

export default function ProfessorAulas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [aulas, setAulas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    console.log('Página de aulas do professor carregada')
  }, [])

  useEffect(() => {
    async function fetchAulas() {
      setLoading(true)
      try {
        console.log('Iniciando busca de videoaulas')
        const q = query(collection(db, "lessons"), where("active", "==", true), orderBy("createdAt", "desc"))
        const snap = await getDocs(q)
        const aulasArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        console.log('Videoaulas carregadas:', {
          total: aulasArr.length,
          total_duration: aulasArr.reduce((sum, aula: any) => sum + (aula.duration || 0), 0),
          total_views: aulasArr.reduce((sum, aula: any) => sum + (aula.views || 0), 0)
        })
        
        setAulas(aulasArr)
      } catch (err) {
        console.error("Erro ao buscar aulas:", err)
        toast({
          title: "Erro ao carregar aulas",
          description: "Não foi possível carregar as videoaulas",
          variant: "destructive"
        })
        setAulas([])
      } finally {
        setLoading(false)
      }
    }
    fetchAulas()
  }, [toast])

  const filteredAulas = aulas.filter(
    (aula) =>
      aula.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSearch = (term: string) => {
    console.log('Busca de aulas realizada:', {
      search_term: term,
      results_count: filteredAulas.length
    })
    setSearchTerm(term)
  }

  async function handleDelete(aula: any) {
    if (!window.confirm("Tem certeza que deseja excluir esta aula? Essa ação não pode ser desfeita.")) return
    
    console.log('Iniciando exclusão de aula:', {
      lesson_id: aula.id,
      lesson_title: aula.title
    })
    
    setDeletingId(aula.id)
    try {
      // Deletar vídeo do Storage
      if (aula.videoUrl) {
        const url = new URL(aula.videoUrl)
        // Extrai o caminho do storage a partir da URL
        const path = decodeURIComponent(url.pathname.replace(/^\/v0\/b\/[^/]+\/o\//, ""))
        await deleteObject(storageRef(storage, path))
      }
      // Deletar documento do Firestore
      await deleteDoc(doc(db, "lessons", aula.id))
      setAulas((prev) => prev.filter((item) => item.id !== aula.id))
      
      console.log('Aula excluída com sucesso:', aula.id)
      toast({ 
        title: "Aula excluída com sucesso!", 
        variant: "default" 
      })
    } catch (err: any) {
      console.error('Erro ao excluir aula:', err)
      toast({ 
        title: "Erro ao excluir aula", 
        description: err?.message || "Tente novamente.", 
        variant: "destructive" 
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleNewLesson = () => {
    console.log('Botão nova aula clicado')
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Videoaulas</h1>
            <p className="text-gray-500">Gerencie as videoaulas disponíveis na plataforma</p>
          </div>
          <Link href="/professor/dashboard/aulas/nova">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              onClick={handleNewLesson}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova aula
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por título ou descrição..."
              className="pl-8 bg-white border-gray-300 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center text-gray-400 py-8 bg-white">Carregando aulas...</div>
          ) : filteredAulas.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500 bg-white">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula encontrada</p>
              <p className="text-gray-500">
                {searchTerm ? "Tente ajustar sua busca" : "Comece criando sua primeira videoaula"}
              </p>
            </div>
          ) : (
            filteredAulas.map((aula) => (
            <Card key={aula.id} className="overflow-hidden bg-white border-gray-200 hover:shadow-md transition-shadow">
              <div className="relative">
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                    <Video className="h-10 w-10" />
                  </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-gray-200">
                        <DropdownMenuItem
                          className="flex items-center text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(aula)}
                          disabled={deletingId === aula.id}
                        >
                        <Trash2 className="mr-2 h-4 w-4" />
                          <span>{deletingId === aula.id ? "Excluindo..." : "Excluir"}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="absolute bottom-2 right-2">
                    <Badge className="bg-black/70 text-white">{Math.floor((aula.duration || 0) / 60)} min</Badge>
                </div>
              </div>
              <CardContent className="p-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{aula.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{aula.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Criada em {aula.createdAt && aula.createdAt.toDate ? aula.createdAt.toDate().toLocaleDateString() : "-"}</span>
                    <span>{aula.views || 0} visualizações</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
