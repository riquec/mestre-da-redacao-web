"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Clock, CheckCircle, Upload, Mic, Search } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { Essay, Correction, EssayTheme } from "@/lib/types"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type EssayWithFile = Essay & {
  fileUrl?: string;
  fileName?: string;
};

export default function ProfessorCorrecoes() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [essays, setEssays] = useState<EssayWithFile[]>([])
  const [themes, setThemes] = useState<Record<string, EssayTheme>>({})
  const [loading, setLoading] = useState(true)
  const [correctionData, setCorrectionData] = useState({
    score: 0,
    competencies: [
      { name: "Domínio da norma culta", score: 0, maxScore: 200 },
      { name: "Compreensão da proposta", score: 0, maxScore: 200 },
      { name: "Seleção de argumentos", score: 0, maxScore: 200 },
      { name: "Coesão textual", score: 0, maxScore: 200 },
      { name: "Proposta de intervenção", score: 0, maxScore: 200 },
    ],
    feedback: "",
    audioFeedback: null as File | null,
    pdfCorrection: null as File | null,
    audioPreview: null as string | null,
    pdfPreview: null as string | null,
    markedImage: null as File | null,
  })
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step de verificação anti-tema escuro
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.className = 'bg-white text-gray-900 antialiased'
    
    console.log('Página de correções do professor carregada')
  }, [])

  useEffect(() => {
    const fetchEssays = async () => {
      if (!user) return

      try {
        console.log('Iniciando busca de redações para correção')
        
        // Buscar redações
        const essaysRef = collection(db, "essays")
        const q = query(
          essaysRef,
          where("correction.assignedTo", "==", user.uid)
        )
        
        const querySnapshot = await getDocs(q)
        console.log("Redações encontradas para correção:", querySnapshot.size)
        
        const essaysData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const essayData = docSnapshot.data() as Essay
          
          // Buscar dados do usuário
          const userDocRef = doc(db, "users", essayData.userId)
          const userDoc = await getDoc(userDocRef)
          const userData = userDoc.data() as { name?: string; email?: string }
          
          return {
            ...essayData,
            id: docSnapshot.id,
            userName: userData?.name || "Usuário não encontrado",
            userEmail: userData?.email || "",
            fileUrl: essayData.fileUrl,
            fileName: essayData.fileName
          } as EssayWithFile
        }))

        // Ordenar localmente após buscar os dados
        essaysData.sort((a, b) => {
          const dateA = a.submittedAt?.toDate() || new Date(0)
          const dateB = b.submittedAt?.toDate() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        })

        setEssays(essaysData)
        console.log("Redações carregadas com sucesso:", {
          total: essaysData.length,
          pending: essaysData.filter(e => !e.correction || (e.correction as any).status !== 'done').length,
          completed: essaysData.filter(e => e.correction && (e.correction as any).status === 'done').length
        })

        // Buscar temas únicos
        const uniqueThemeIds = [...new Set(essaysData.map(essay => essay.themeId))]
        const themesData: Record<string, EssayTheme> = {}

        for (const themeId of uniqueThemeIds) {
          const themeDocRef = doc(db, "essayThemes", themeId)
          const themeDoc = await getDoc(themeDocRef)
          if (themeDoc.exists()) {
            themesData[themeId] = {
              id: themeDoc.id,
              ...themeDoc.data()
            } as EssayTheme
          }
        }

        setThemes(themesData)
        console.log('Temas carregados:', Object.keys(themesData).length)
      } catch (error) {
        console.error("Erro ao buscar redações:", error)
        toast.error("Erro ao carregar redações para correção")
      } finally {
        setLoading(false)
      }
    }

    fetchEssays()
  }, [user])

  const filteredEssays = essays.filter(
    (essay) =>
      essay.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (themes[essay.themeId]?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const pendingEssays = filteredEssays.filter(
    essay => essay.correction && typeof (essay.correction as any).status === 'string' && (essay.correction as any).status === "pending"
      || !essay.correction || (typeof (essay.correction as any).status !== 'string')
  )
  const completedEssays = filteredEssays.filter(
    essay => essay.correction && typeof (essay.correction as any).status === 'string' && (essay.correction as any).status === "done"
  )

  const handleSelectCorrection = (id: string) => {
    console.log('Redação selecionada para correção:', id)
    setSelectedCorrection(id)
    const essay = essays.find(e => e.id === id)
    if (essay?.correction) {
      setCorrectionData({
        ...correctionData,
        score: essay.correction.score?.total || 0,
        feedback: (essay.correction as any).feedback || "",
      })
    }
  }

  const handleBack = () => {
    console.log('Voltando para lista de correções')
    setSelectedCorrection(null)
  }

  const handleCompetencyChange = (index: number, value: number[]) => {
    const newCompetencies = [...correctionData.competencies]
    newCompetencies[index].score = value[0]

    const totalScore = newCompetencies.reduce((sum, comp) => sum + comp.score, 0)

    console.log('Competência alterada:', {
      competency: newCompetencies[index].name,
      new_score: value[0],
      total_score: totalScore
    })

    setCorrectionData({
      ...correctionData,
      competencies: newCompetencies,
      score: totalScore,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      console.log('Imagem marcada carregada:', e.target.files[0].name)
      setCorrectionData({
        ...correctionData,
        markedImage: e.target.files[0],
      })
    }
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      console.log('PDF de correção carregado:', file.name)
      setCorrectionData({
        ...correctionData,
        pdfCorrection: file,
        pdfPreview: URL.createObjectURL(file)
      })
    }
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      console.log('Áudio de feedback carregado:', file.name)
      setCorrectionData({
        ...correctionData,
        audioFeedback: file,
        audioPreview: URL.createObjectURL(file)
      })
    }
  }

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCorrectionData({
      ...correctionData,
      feedback: e.target.value,
    })
  }

  const handleSubmitCorrection = async () => {
    if (!selectedCorrection || !user) return
    setIsSubmitting(true)
    let audioRef, pdfRef, audioUrl = '', pdfUrl = ''
    try {
      // 1. Upload dos arquivos
      if (correctionData.audioFeedback) {
        audioRef = ref(storage, `corrections/${selectedCorrection}/audio-feedback`)
        await uploadBytes(audioRef, correctionData.audioFeedback)
        audioUrl = await getDownloadURL(audioRef)
      }
      if (correctionData.pdfCorrection) {
        pdfRef = ref(storage, `corrections/${selectedCorrection}/correction-pdf`)
        await uploadBytes(pdfRef, correctionData.pdfCorrection)
        pdfUrl = await getDownloadURL(pdfRef)
      }
      // 2. Atualizar documento no Firestore
      const essayRef = doc(db, "essays", selectedCorrection)
      const total = correctionData.competencies.reduce((sum, comp) => sum + comp.score, 0);
      const scoreObj = {
        total,
        dominioNormaCulta: correctionData.competencies[0].score,
        compreensaoProposta: correctionData.competencies[1].score,
        selecaoArgumentos: correctionData.competencies[2].score,
        coesaoTextual: correctionData.competencies[3].score,
        propostaIntervencao: correctionData.competencies[4].score
      }
      await updateDoc(essayRef, {
        correction: {
          ...(essays.find(e => e.id === selectedCorrection)?.correction || {}),
          audioFileUrl: audioUrl,
          correctionFileUrl: pdfUrl,
          correctionFileName: correctionData.pdfCorrection?.name,
          completedAt: new Date(),
          score: scoreObj,
          status: "done"
        }
      })

      // 3. Recarregar os dados das redações
      const essaysRef = collection(db, "essays")
      const q = query(
        essaysRef,
        where("correction.assignedTo", "==", user.uid)
      )
      
      const querySnapshot = await getDocs(q)
      const essaysData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const essayData = docSnapshot.data() as Essay
        const userDocRef = doc(db, "users", essayData.userId)
        const userDoc = await getDoc(userDocRef)
        const userData = userDoc.data() as { name?: string; email?: string }
        
        return {
          ...essayData,
          id: docSnapshot.id,
          userName: userData?.name || "Usuário não encontrado",
          userEmail: userData?.email || "",
          fileUrl: essayData.fileUrl,
          fileName: essayData.fileName
        } as EssayWithFile
      }))

      // Ordenar localmente após buscar os dados
      essaysData.sort((a, b) => {
        const dateA = a.submittedAt?.toDate() || new Date(0)
        const dateB = b.submittedAt?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      setEssays(essaysData)

      // 4. Sucesso: mostrar pop-up e redirecionar
      toast.success("Correção enviada com sucesso!")
      setSelectedCorrection(null)
    } catch (error) {
      // 5. Se falhar, deletar arquivos enviados
      if (audioRef) await audioRef && (await import("firebase/storage")).deleteObject(audioRef)
      if (pdfRef) await pdfRef && (await import("firebase/storage")).deleteObject(pdfRef)
      toast.error("Erro ao enviar correção. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 900) return "bg-green-50 text-green-700 border-green-200"
    if (score >= 700) return "bg-blue-50 text-blue-700 border-blue-200"
    if (score >= 500) return "bg-yellow-50 text-yellow-700 border-yellow-200"
    return "bg-red-50 text-red-700 border-red-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando correções...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Correções</h1>
        <p className="text-gray-500">Gerencie as correções de redações dos alunos</p>
      </div>

      {!selectedCorrection ? (
        <>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por aluno ou título..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pendentes ({pendingEssays.length})</TabsTrigger>
              <TabsTrigger value="completed">Concluídas ({completedEssays.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="grid gap-4">
                {pendingEssays.map((essay) => (
                  <Card key={essay.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="bg-yellow-100 rounded-md p-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">{themes[essay.themeId]?.title || 'Tema não encontrado'}</h3>
                            <p className="text-sm text-gray-500 mt-2">
                              Aluno: {essay.userName} • Enviada {essay.submittedAt.toDate().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => handleSelectCorrection(essay.id)}>Corrigir</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingEssays.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <p>Nenhuma correção pendente encontrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid gap-4">
                {completedEssays.map((essay) => (
                  <Card key={essay.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 rounded-md p-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">{themes[essay.themeId]?.title || 'Tema não encontrado'}</h3>
                            <Badge variant="outline" className={getScoreColor((essay.correction && essay.correction.score?.total) || 0)}>
                              Nota: {essay.correction && essay.correction.score && essay.correction.score.total}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-2">
                              Aluno: {essay.userName} • Corrigida {essay.correctedAt?.toDate().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => handleSelectCorrection(essay.id)} disabled>
                          Ver detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {completedEssays.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <p>Nenhuma correção concluída encontrada</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={handleBack}>
            Voltar para lista
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Corrigir redação</CardTitle>
              <CardDescription>{themes[essays.find((e) => e.id === selectedCorrection)?.themeId || '']?.title || 'Tema não encontrado'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Informações da redação</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Aluno:</span>
                      <span className="font-medium">
                        {essays.find((e) => e.id === selectedCorrection)?.userName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Proposta:</span>
                      <span className="font-medium">
                        {themes[essays.find((e) => e.id === selectedCorrection)?.themeId || ""]?.title || "Tema não encontrado"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Enviada:</span>
                      <span className="font-medium">
                        {essays.find((e) => e.id === selectedCorrection)?.submittedAt.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Redação do aluno</h3>
                <div className="border rounded-md overflow-hidden p-4 flex flex-col gap-2 items-start">
                  {selectedCorrection && (() => {
                    const essay = essays.find((e) => e.id === selectedCorrection);
                    if (!essay) return null;
                    const fileUrl = essay.fileUrl;
                    const fileName = essay.fileName || 'redacao-aluno';
                    // Função para identificar extensão
                    const getFileExtension = (nameOrUrl: string) => {
                      const match = nameOrUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
                      return match ? match[1].toLowerCase() : '';
                    };
                    const ext = getFileExtension(fileName) || getFileExtension(fileUrl || '');
                    const isPdf = ext === 'pdf';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
                    if (!fileUrl) {
                      return <div>Nenhum arquivo disponível</div>;
                    }
                    return (
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                          <a
                            href={fileUrl}
                            download={fileName}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Baixar arquivo
                          </a>
                          <span className="text-gray-500 text-xs">{fileName}</span>
                        </div>
                        {isPdf && (
                          <iframe
                            src={fileUrl}
                            className="w-full h-64 border rounded-md mt-2"
                            title="Pré-visualização do PDF da redação"
                          />
                        )}
                        {isImage && (
                          <img src={fileUrl} alt="Redação" className="max-w-full max-h-96 border rounded-md mt-2" />
                        )}
                        {/* Para outros tipos, não renderiza preview */}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Upload do PDF da correção</h3>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium mb-1">
                    Arraste e solte o PDF da correção ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Formato aceito: PDF (máx. 5MB)</p>
                  <div className="flex items-center gap-4">
                    <Input
                      id="pdf-correction"
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                    />
                    {correctionData.pdfCorrection && (
                      <span className="text-sm text-gray-500">
                        {correctionData.pdfCorrection.name}
                      </span>
                    )}
                  </div>
                  {correctionData.pdfPreview && (
                    <iframe
                      src={correctionData.pdfPreview}
                      className="w-full h-64 border rounded-md mt-4"
                      title="Pré-visualização do PDF"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Avaliação por competência</h3>
                <div className="space-y-6">
                  {correctionData.competencies.map((comp, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{comp.name}</Label>
                        <span className="font-medium">
                          {comp.score}/{comp.maxScore}
                        </span>
                      </div>
                      <Slider
                        value={[comp.score]}
                        max={comp.maxScore}
                        step={10}
                        onValueChange={(value) => handleCompetencyChange(index, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Nota final</h3>
                  <div className="text-2xl font-bold">{correctionData.score}</div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      correctionData.score >= 900
                        ? "bg-green-500"
                        : correctionData.score >= 700
                          ? "bg-blue-500"
                          : correctionData.score >= 500
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${(correctionData.score / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Feedback em áudio</h3>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <Mic className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium mb-1">
                    Arraste e solte o arquivo de áudio ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Formatos aceitos: MP3, WAV (máx. 10MB)</p>
                  <div className="flex items-center gap-4">
                    <Input
                      id="audio-feedback"
                      type="file"
                      accept=".mp3,.wav"
                      onChange={handleAudioUpload}
                    />
                    {correctionData.audioFeedback && (
                      <span className="text-sm text-gray-500">
                        {correctionData.audioFeedback.name}
                      </span>
                    )}
                  </div>
                  {correctionData.audioPreview && (
                    <audio controls className="w-full mt-4">
                      <source src={correctionData.audioPreview} type="audio/mpeg" />
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSubmitCorrection}
                disabled={isSubmitting || !correctionData.audioFeedback || !correctionData.pdfCorrection}
              >
                {isSubmitting ? "Enviando..." : "Enviar correção"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
