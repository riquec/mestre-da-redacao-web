import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, CheckCircle } from "lucide-react"

export default function Aulas() {
  // Mock data - in a real app, this would come from your backend
  const lessons = [
    {
      id: 1,
      title: "Introdução à redação dissertativa",
      description: "Aprenda os fundamentos da redação dissertativa-argumentativa",
      duration: "15 min",
      watched: true,
      progress: 100,
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 2,
      title: "Estrutura do texto argumentativo",
      description: "Como estruturar seu texto com introdução, desenvolvimento e conclusão",
      duration: "22 min",
      watched: false,
      progress: 75,
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 3,
      title: "Conectivos e coesão textual",
      description: "Aprenda a conectar suas ideias de forma coesa e coerente",
      duration: "18 min",
      watched: false,
      progress: 0,
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 4,
      title: "Repertório sociocultural",
      description: "Como utilizar referências culturais e sociais para enriquecer seu texto",
      duration: "25 min",
      watched: false,
      progress: 0,
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 5,
      title: "Proposta de intervenção",
      description: "Aprenda a elaborar propostas de intervenção eficazes para o ENEM",
      duration: "20 min",
      watched: false,
      progress: 0,
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
    {
      id: 6,
      title: "Análise de redações nota 1000",
      description: "Estudo de caso: o que faz uma redação receber nota máxima",
      duration: "30 min",
      watched: false,
      progress: 0,
      thumbnail: "/placeholder.svg?height=180&width=320",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Videoaulas</h1>
        <p className="text-gray-500">Assista às aulas para aprimorar suas técnicas de redação</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="overflow-hidden">
            <div className="relative">
              <img
                src={lesson.thumbnail || "/placeholder.svg"}
                alt={lesson.title}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 text-primary fill-primary" />
                </div>
                {lesson.watched && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Assistido</span>
                  </div>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{lesson.title}</h3>
                  <Badge variant="outline">{lesson.duration}</Badge>
                </div>
                <p className="text-sm text-gray-500">{lesson.description}</p>
                {lesson.progress > 0 && lesson.progress < 100 && (
                  <div className="space-y-1">
                    <Progress value={lesson.progress} className="h-1" />
                    <p className="text-xs text-gray-500 text-right">{lesson.progress}% concluído</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
