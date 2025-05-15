"use client"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface Props {
  id: string
}

export function EssayDetails({ id }: Props) {
  const [essay, setEssay] = useState<any>(null)
  const [theme, setTheme] = useState<any>(null)
  const [professorName, setProfessorName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      // Buscar redação
      const essayRef = doc(db, "essays", id)
      const essaySnap = await getDoc(essayRef)
      if (!essaySnap.exists()) return setLoading(false)
      const essayData = essaySnap.data()
      setEssay(essayData)

      // Buscar tema
      if (essayData.themeId) {
        const themeRef = doc(db, "essayThemes", essayData.themeId)
        const themeSnap = await getDoc(themeRef)
        if (themeSnap.exists()) setTheme(themeSnap.data())
      }

      // Buscar nome do professor
      if (essayData.correction?.assignedTo) {
        const profRef = doc(db, "users", essayData.correction.assignedTo)
        const profSnap = await getDoc(profRef)
        if (profSnap.exists()) setProfessorName(profSnap.data().name)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>
  if (!essay) return <div className="p-8 text-center text-red-500">Redação não encontrada.</div>

  // Arquivo da redação
  const fileName = essay.fileName || essay.file?.name
  const fileUrl = essay.fileUrl || essay.file?.url

  // Arquivos de correção
  const correctionFileUrl = essay.correction?.correctionFileUrl
  const correctionFileName = essay.correction?.correctionFileName || "Arquivo de correção"
  const audioFileUrl = essay.correction?.audioFileUrl
  const completedAt = essay.correction?.completedAt?.toDate ? essay.correction.completedAt.toDate() : null
  const score = essay.correction?.score

  // Função para identificar extensão
  const getFileExtension = (nameOrUrl: string) => {
    const match = nameOrUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/)
    return match ? match[1].toLowerCase() : ''
  }
  const correctionFileExt = correctionFileUrl ? getFileExtension(correctionFileUrl) : ''
  const isCorrectionPdf = correctionFileExt === 'pdf'
  const isCorrectionImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(correctionFileExt)

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="pb-2 border-b">
          {/* Título do tema */}
          <CardTitle className="text-2xl font-bold text-blue-900 mb-2">
            {theme?.title || "Tema não encontrado"}
          </CardTitle>
          {/* Datas */}
          <CardDescription className="text-gray-600 mb-1">
            Enviada em {essay.submittedAt?.toDate().toLocaleDateString()}
            {completedAt && (
              <>
                {" • "}Corrigida em {completedAt.toLocaleDateString()}
              </>
            )}
          </CardDescription>
          {/* Professor responsável */}
          {professorName && (
            <CardDescription className="text-gray-600 mb-1">
              Corrigida por: <span className="font-semibold">{professorName}</span>
            </CardDescription>
          )}
          {/* Nota total */}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-green-700">Nota final:</span>
            <span className="text-lg">{score?.total ?? "--"}</span>
          </div>
          {/* Notas por competência */}
          {score && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-700">
              <div>Domínio da norma culta: <span className="font-semibold">{score.dominioNormaCulta}</span></div>
              <div>Compreensão da proposta: <span className="font-semibold">{score.compreensaoProposta}</span></div>
              <div>Seleção de argumentos: <span className="font-semibold">{score.selecaoArgumentos}</span></div>
              <div>Coesão textual: <span className="font-semibold">{score.coesaoTextual}</span></div>
              <div>Proposta de intervenção: <span className="font-semibold">{score.propostaIntervencao}</span></div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Arquivo enviado */}
          {fileUrl && (
            <div className="mt-6">
              <span className="font-semibold block mb-2">Arquivo enviado:</span>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-gray-400" />
                <span className="font-medium text-sm">{fileName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Baixar
                </Button>
              </div>
              {(() => {
                const lowerName = (fileName || '').toLowerCase()
                const lowerUrl = fileUrl.toLowerCase()
                const isPdf = lowerName.endsWith('.pdf') || lowerUrl.endsWith('.pdf')
                const isImage = ['.jpg', '.jpeg', '.png', '.gif'].some(ext => lowerName.endsWith(ext) || lowerUrl.endsWith(ext))
                if (isPdf) {
                  return (
                    <iframe
                      src={`${fileUrl}#toolbar=0`}
                      className="w-full h-[500px] rounded-md border"
                      title={fileName || 'Arquivo enviado'}
                      allow="autoplay"
                    />
                  )
                } else if (isImage) {
                  return (
                    <img
                      src={fileUrl}
                      alt={fileName || 'Arquivo enviado'}
                      className="max-h-[500px] w-auto rounded-md border mx-auto"
                    />
                  )
                } else {
                  return (
                    <div className="mt-4 text-gray-500 text-sm">
                      Tipo de arquivo não suportado para pré-visualização. Faça o download para visualizar.
                    </div>
                  )
                }
              })()}
            </div>
          )}

          {/* Arquivo da correção */}
          {correctionFileUrl && (
            <div className="mt-6">
              <span className="font-semibold block mb-2">Arquivo da correção:</span>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-gray-400" />
                <span className="font-medium text-sm">{correctionFileName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(correctionFileUrl, '_blank')}
                >
                  Baixar
                </Button>
              </div>
              {(() => {
                const lowerName = (correctionFileName || '').toLowerCase()
                const isPdf = lowerName.endsWith('.pdf')
                const isImage = ['.jpg', '.jpeg', '.png', '.gif'].some(ext => lowerName.endsWith(ext))
                if (isPdf) {
                  return (
                    <div className="mt-4">
                      <iframe
                        src={`${correctionFileUrl}#toolbar=0`}
                        className="w-full h-[500px] rounded-md border"
                        title={correctionFileName || 'Arquivo da correção'}
                        allow="autoplay"
                      />
                    </div>
                  )
                } else if (isImage) {
                  return (
                    <div className="mt-4">
                      <img
                        src={correctionFileUrl}
                        alt={correctionFileName || 'Arquivo da correção'}
                        className="max-h-[500px] w-auto rounded-md border mx-auto"
                      />
                    </div>
                  )
                } else {
                  return (
                    <div className="mt-4 text-gray-500 text-sm">
                      Tipo de arquivo não suportado para pré-visualização. Faça o download para visualizar.
                    </div>
                  )
                }
              })()}
            </div>
          )}

          {/* Áudio da correção */}
          {audioFileUrl && (
            <div>
              <span className="font-semibold">Feedback em áudio:</span>
              <audio controls src={audioFileUrl} className="w-full mt-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}