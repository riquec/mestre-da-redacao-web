"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Clock, CheckCircle, FileText, Play, MessageSquare } from "lucide-react"
import { useLogger } from "@/lib/logger"

export default function Correcoes() {
  const [selectedCorrection, setSelectedCorrection] = useState<number | null>(null)
  const log = useLogger('CorrecoesAluno', '/dashboard/correcoes')

  // Step 1: Verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    log.info('Página de correções carregada', {
      action: 'page_load',
      metadata: { theme: 'light_forced' }
    })
  }, [log])

  // Mock data - in a real app, this would come from your backend
  const pendingCorrections = [
    {
      id: 1,
      title: "Os desafios da educação no Brasil pós-pandemia",
      category: "ENEM",
      status: "Em análise",
      submittedAt: "2 dias atrás",
    },
    {
      id: 2,
      title: "O papel da tecnologia na democratização do conhecimento",
      category: "FUVEST",
      status: "Na fila",
      submittedAt: "4 dias atrás",
    },
  ]

  const completedCorrections = [
    {
      id: 3,
      title: "Sustentabilidade e desenvolvimento econômico",
      category: "ENEM",
      score: 850,
      completedAt: "1 semana atrás",
      feedback: {
        image: "/placeholder.svg?height=800&width=600",
        audio: "https://example.com/audio.mp3", // This would be a real audio URL in production
        notes:
          "Sua redação apresenta bons argumentos, mas precisa melhorar a conclusão. A proposta de intervenção está incompleta e faltam agentes. Trabalhe mais na coesão entre os parágrafos.",
        competencies: [
          { name: "Domínio da norma culta", score: 180, maxScore: 200 },
          { name: "Compreensão da proposta", score: 160, maxScore: 200 },
          { name: "Seleção de argumentos", score: 180, maxScore: 200 },
          { name: "Coesão textual", score: 160, maxScore: 200 },
          { name: "Proposta de intervenção", score: 170, maxScore: 200 },
        ],
      },
    },
    {
      id: 4,
      title: "A questão da privacidade na era digital",
      category: "UNICAMP",
      score: 920,
      completedAt: "2 semanas atrás",
      feedback: {
        image: "/placeholder.svg?height=800&width=600",
        audio: "https://example.com/audio2.mp3", // This would be a real audio URL in production
        notes:
          "Excelente redação! Seus argumentos são sólidos e bem fundamentados. A proposta de intervenção é detalhada e viável. Apenas pequenos ajustes na norma culta são necessários.",
        competencies: [
          { name: "Domínio da norma culta", score: 180, maxScore: 200 },
          { name: "Compreensão da proposta", score: 190, maxScore: 200 },
          { name: "Seleção de argumentos", score: 190, maxScore: 200 },
          { name: "Coesão textual", score: 180, maxScore: 200 },
          { name: "Proposta de intervenção", score: 180, maxScore: 200 },
        ],
      },
    },
  ]

  const handleViewCorrection = (id: number) => {
    setSelectedCorrection(id)
  }

  const handleBack = () => {
    setSelectedCorrection(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em análise":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "Na fila":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return ""
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 900) return "bg-green-50 text-green-700 border-green-200"
    if (score >= 700) return "bg-blue-50 text-blue-700 border-blue-200"
    if (score >= 500) return "bg-yellow-50 text-yellow-700 border-yellow-200"
    return "bg-red-50 text-red-700 border-red-200"
  }

  const selectedCorrectionData = completedCorrections.find((c) => c.id === selectedCorrection)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Correções</h1>
        <p className="text-gray-500">Acompanhe o status das suas redações e veja os feedbacks</p>
      </div>

      {!selectedCorrection ? (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-6">
              {pendingCorrections.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Pendentes</h2>
                  <div className="grid gap-4">
                    {pendingCorrections.map((correction) => (
                      <Card key={correction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="bg-yellow-100 rounded-md p-2 mt-1">
                                <Clock className="h-5 w-5 text-yellow-500" />
                              </div>
                              <div>
                                <h3 className="font-medium">{correction.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">{correction.category}</Badge>
                                  <Badge variant="outline" className={getStatusColor(correction.status)}>
                                    {correction.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Enviada {correction.submittedAt}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {completedCorrections.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Concluídas</h2>
                  <div className="grid gap-4">
                    {completedCorrections.map((correction) => (
                      <Card key={correction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="bg-green-100 rounded-md p-2 mt-1">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <h3 className="font-medium">{correction.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">{correction.category}</Badge>
                                  <Badge variant="outline" className={getScoreColor(correction.score)}>
                                    Nota: {correction.score}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Corrigida {correction.completedAt}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleViewCorrection(correction.id)}>
                              Ver correção
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid gap-4">
              {pendingCorrections.map((correction) => (
                <Card key={correction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="bg-yellow-100 rounded-md p-2 mt-1">
                          <Clock className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{correction.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{correction.category}</Badge>
                            <Badge variant="outline" className={getStatusColor(correction.status)}>
                              {correction.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">Enviada {correction.submittedAt}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4">
              {completedCorrections.map((correction) => (
                <Card key={correction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-100 rounded-md p-2 mt-1">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{correction.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{correction.category}</Badge>
                            <Badge variant="outline" className={getScoreColor(correction.score)}>
                              Nota: {correction.score}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">Corrigida {correction.completedAt}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewCorrection(correction.id)}>
                        Ver correção
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        selectedCorrectionData && (
          <div className="space-y-6">
            <Button variant="outline" onClick={handleBack}>
              Voltar para lista
            </Button>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedCorrectionData.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{selectedCorrectionData.category}</Badge>
                        <Badge variant="outline" className={getScoreColor(selectedCorrectionData.score)}>
                          Nota: {selectedCorrectionData.score}
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Corrigida {selectedCorrectionData.completedAt}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Sua redação com marcações
                  </h3>
                  <div className="border rounded-md overflow-hidden">
                    <img
                      src={selectedCorrectionData.feedback.image || "/placeholder.svg"}
                      alt="Redação corrigida"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Áudio do professor
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <audio controls className="w-full">
                      <source src={selectedCorrectionData.feedback.audio} type="audio/mpeg" />
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Notas por competência</h3>
                  <div className="grid gap-3">
                    {selectedCorrectionData.feedback.competencies.map((comp, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{comp.name}</span>
                          <span className="font-medium">
                            {comp.score}/{comp.maxScore}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(comp.score / comp.maxScore) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Comentários do professor</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700">{selectedCorrectionData.feedback.notes}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Enviar mensagem ao professor
                  </h3>
                  <Textarea
                    placeholder="Tem alguma dúvida sobre a correção? Escreva aqui para o professor..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button>Enviar mensagem</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      <Button 
        variant="outline" 
        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
      >
        Nova Correção
      </Button>
    </div>
  )
}
