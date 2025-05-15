"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Plus, Search, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ProfessorAulas() {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data - in a real app, this would come from your backend
  const aulas = [
    {
      id: 1,
      title: "Introdução à redação dissertativa",
      description: "Aprenda os fundamentos da redação dissertativa-argumentativa",
      duration: "15 min",
      views: 156,
      createdAt: "10/01/2023",
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 2,
      title: "Estrutura do texto argumentativo",
      description: "Como estruturar seu texto com introdução, desenvolvimento e conclusão",
      duration: "22 min",
      views: 142,
      createdAt: "15/01/2023",
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 3,
      title: "Conectivos e coesão textual",
      description: "Aprenda a conectar suas ideias de forma coesa e coerente",
      duration: "18 min",
      views: 98,
      createdAt: "22/01/2023",
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 4,
      title: "Repertório sociocultural",
      description: "Como utilizar referências culturais e sociais para enriquecer seu texto",
      duration: "25 min",
      views: 87,
      createdAt: "01/02/2023",
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 5,
      title: "Proposta de intervenção",
      description: "Aprenda a elaborar propostas de intervenção eficazes para o ENEM",
      duration: "20 min",
      views: 112,
      createdAt: "10/02/2023",
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 6,
      title: "Análise de redações nota 1000",
      description: "Estudo de caso: o que faz uma redação receber nota máxima",
      duration: "30 min",
      views: 203,
      createdAt: "20/02/2023",
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
  ]

  const filteredAulas = aulas.filter(
    (aula) =>
      aula.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videoaulas</h1>
          <p className="text-gray-500">Gerencie as videoaulas disponíveis na plataforma</p>
        </div>
        <Link href="/professor/dashboard/aulas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova aula
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título ou descrição..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAulas.map((aula) => (
          <Card key={aula.id} className="overflow-hidden">
            <div className="relative">
              <img src={aula.thumbnail || "/placeholder.svg"} alt={aula.title} className="w-full h-40 object-cover" />
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-black/70 text-white">{aula.duration}</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{aula.title}</h3>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{aula.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Criada em {aula.createdAt}</span>
                  <span>{aula.views} visualizações</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAulas.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>Nenhuma aula encontrada</p>
        </div>
      )}
    </div>
  )
}
